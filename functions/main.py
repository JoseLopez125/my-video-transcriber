# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from google.cloud import storage
from datetime import timedelta
from google.cloud import videointelligence
import json

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)


# functions/main.py

BUCKET_NAME = "myvideotranscriber-video-uploads"
STORAGE_CLIENT = storage.Client()

def generate_upload_signed_url(blob_name: str):
    """Generates a v4 signed URL for uploading a file."""
    bucket = STORAGE_CLIENT.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        # URL is valid for 15 minutes
        expiration=timedelta(minutes=15), 
        method="PUT",
        content_type="video/*" # Require client to upload a video format
    )
    return url

@https_fn.on_request()
def get_upload_url(req: https_fn.Request):
    """API endpoint to request a signed URL."""
    try:
        # Get filename from the request body (e.g., user's unique ID + filename)
        body = req.get_json(silent=True)
        filename = body.get("filename")
        if not filename:
            return https_fn.Response(json.dumps({"error": "Missing filename"}), status=400)

        signed_url = generate_upload_signed_url(filename)
        
        return https_fn.Response(json.dumps({"uploadUrl": signed_url}), status=200, mimetype="application/json")
    
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500)

def get_transcript():
    video_client = videointelligence.VideoIntelligenceServiceClient()
    features = [videointelligence.Feature.SPEECH_TRANSCRIPTION]

    config = videointelligence.SpeechTranscriptionConfig(
        language_code="en-US", enable_automatic_punctuation=True
    )
    video_context = videointelligence.VideoContext(speech_transcription_config=config)

    operation = video_client.annotate_video(
        request={
            "features": features,
            "input_uri": path,
            "video_context": video_context,
        }
    )

    print("\nProcessing video for speech transcription.")

    result = operation.result(timeout=600)

    # There is only one annotation_result since only
    # one video is processed.
    annotation_results = result.annotation_results[0]
    for speech_transcription in annotation_results.speech_transcriptions:
        # The number of alternatives for each transcription is limited by
        # SpeechTranscriptionConfig.max_alternatives.
        # Each alternative is a different possible transcription
        # and has its own confidence score.
        for alternative in speech_transcription.alternatives:
            print("Alternative level information:")

            print("Transcript: {}".format(alternative.transcript))
            print("Confidence: {}\n".format(alternative.confidence))

            print("Word level information:")
            for word_info in alternative.words:
                word = word_info.word
                start_time = word_info.start_time
                end_time = word_info.end_time
                print(
                    "\t{}s - {}s: {}".format(
                        start_time.seconds + start_time.microseconds * 1e-6,
                        end_time.seconds + end_time.microseconds * 1e-6,
                        word,
                    )
                )

# initialize_app()
#
#
# @https_fn.on_request()
# def on_request_example(req: https_fn.Request) -> https_fn.Response:
#     return https_fn.Response("Hello world!")