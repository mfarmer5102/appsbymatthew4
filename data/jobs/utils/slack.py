import os
from slack_sdk import WebClient


def publish_slack_message(message):

    try:

        # NOTE: May need to call `/invite @digital-assistant` in corresponding channel

        # Set up a WebClient with the Slack OAuth token
        client = WebClient(token=os.environ["SLACK_TOKEN"])

        # Send a message
        client.chat_postMessage(
            channel="digital-assistant",
            text=f"<@UQ0001R42> {message}",
            username="Digital Assistant"
        )

    except Exception as e:
        print(e)
        print("Unable to post Slack message.")


