# Welcome to Cloud Functions for Firebase for Python!
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from google.cloud import storage # Required for its GCS object types, though not for client creation
from datetime import timedelta
from google.cloud import videointelligence
import json
import os
from firebase_admin import functions # Required for config access in legacy runtimes

set_global_options(max_instances=10)

# Initialize Firebase Admin SDK globally. This grants the function implicit access 
# to Firebase services like Storage and the Video Intelligence API.
initialize_app()

# We set BUCKET_NAME globally for use in the GCS URI f-string within get_transcript.
# NOTE: You should set BUCKET_NAME environment variable to your Appspot bucket name upon deployment
BUCKET_NAME = os.environ.get("BUCKET_NAME", "myvideotranscriber.firebasestorage.app") 


def get_transcript(file_path: str):
    """
    Triggers the Video Intelligence API to transcribe the video at the given GCS URI.
    
    Args:
        file_path (str): The full GCS URI (gs://bucket-name/path/file.mp4).
        
    Returns:
        str: The full transcribed text.
    """
    
    # The video client automatically uses the function's service account credentials 
    # to access the file in the GCS bucket specified by input_uri.
    video_client = videointelligence.VideoIntelligenceServiceClient()
    features = [videointelligence.Feature.SPEECH_TRANSCRIPTION]

    config = videointelligence.SpeechTranscriptionConfig(
        language_code="en-US", enable_automatic_punctuation=True
    )
    video_context = videointelligence.VideoContext(speech_transcription_config=config)

    # The API is called with the full GCS URI provided by the frontend.
    operation = video_client.annotate_video(
        request={
            "features": features,
            "input_uri": file_path, 
            "video_context": video_context,
        }
    )

    print(f"\nProcessing video at {file_path} for speech transcription. This is a long-running operation.")

    # This is a blocking call (waits up to 10 minutes) for the result.
    result = operation.result(timeout=600) 

    max_chars_per_line = 80
    transcript = ""

    if result.annotation_results and result.annotation_results[0].speech_transcriptions:
        annotation_results = result.annotation_results[0]
        for speech_transcription in annotation_results.speech_transcriptions:
            if not speech_transcription.alternatives:
                continue

            # Process the best alternative
            alternative = speech_transcription.alternatives[0]
            if not alternative.words:
                continue

            # Logic to build lines word-by-word
            current_line = ""
            line_start_time = None
            
            for word_info in alternative.words:
                # If the line is empty, this is the first word. Set the start time.
                if not current_line:
                    line_start_time = word_info.start_time

                # Check if adding the next word exceeds the max character limit
                if len(current_line) + len(word_info.word) > max_chars_per_line:
                    # The line is full. Finalize it.
                    # The end time is the end time of the previous word.
                    line_end_time = previous_word_info.end_time
                    
                    # Format the timestamps and the line
                    start_s = line_start_time.seconds + line_start_time.microseconds * 1e-6
                    end_s = line_end_time.seconds + line_end_time.microseconds * 1e-6
                    transcript += f"[{start_s:.2f}s - {end_s:.2f}s] {current_line.strip()}\n"
                    
                    # Start a new line with the current word
                    current_line = word_info.word + " "
                    line_start_time = word_info.start_time
                else:
                    # Add the word to the current line
                    current_line += word_info.word + " "

                # Keep track of the current word to get its end time for the next iteration
                previous_word_info = word_info

            # After the loop, add the last remaining line to the transcript
            if current_line:
                line_end_time = previous_word_info.end_time
                start_s = line_start_time.seconds + line_start_time.microseconds * 1e-6
                end_s = line_end_time.seconds + line_end_time.microseconds * 1e-6
                transcript += f"[{start_s:.2f}s - {end_s:.2f}s] {current_line.strip()}\n"
    return transcript

# The only exposed HTTP function now is the processing trigger.
@https_fn.on_request()
def start_processing(req: https_fn.Request):
    """
    Receives the GCS path from the client after the file upload, 
    triggers transcription, and returns the result.
    """
    
    # --- CORS Headers (Required for communication with React frontend) ---
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)
        
    try:
        body = req.get_json(silent=True)
        # Frontend sends the full GCS URI (gs://bucket/path/file.mp4)
        gcs_path = body.get("gcsPath") 
        
        if not gcs_path:
            return https_fn.Response(json.dumps({"error": "Missing GCS path in request body."}), status=400, headers=headers)
            
        # Call the transcription function (blocking call)
        final_transcript = get_transcript(gcs_path) 
        
        # NOTE: This is where you would typically save the transcript and path to a database.
        
        return https_fn.Response(
            json.dumps({"status": "Success", "transcript": final_transcript}), 
            status=200, 
            mimetype="application/json",
            headers=headers
        )
        
    except Exception as e:
        print(f"Transcription failed: {e}")
        return https_fn.Response(json.dumps({"error": f"Transcription failed: {str(e)}"}), status=500, headers=headers)

# NOTE: The unused get_upload_url and related functions from the previous GCS workflow are removed here for cleanliness.
