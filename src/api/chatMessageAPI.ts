import { connectSSE } from "./sseClient";
import { AppDispatch } from "../app/store";
import { ApiConfig } from "../config/apiConfig";
import { splitCustomWords } from "../utils/utils";
import { updateLastMessageData } from "../features/chatbot/chatMessageList/chatbotSlice";
import { Delimiter, MessageType } from "../models/chatMessage";
import Constants from "expo-constants";

const { DIFY_API_KEY } = Constants.expoConfig?.extra ?? {};

export const sendStreamMessage = ({
  message,
  actionId,
  level,
  target,
  dispatch,
}: {
  message?: string;
  actionId?: string;
  level?: string;
  target?: string;
  dispatch: AppDispatch;
}) => {
  let fullText = "";
  let wordIndex = 0;
  let wordLength = 0;
  let isQuestionJson = false;

  // Original stream
  connectSSE({
    url: ApiConfig.difyServerUrl,
    token: DIFY_API_KEY,
    body: {
      query: message ?? "<init>",
      inputs: {
        level: level,
        target: target,
        action_id: actionId,
      },
      response_mode: "streaming",
      user: "dainn",
      auto_generate_name: false,
    },
    onOpen: () => {},
    onMessage: (data) => {
      const type = data["event"];
      const messageId = data["message_id"];
      const text = data["answer"];

      if (type === "message") {
        const jsonPattern = "``";

        if (!isQuestionJson && text.includes(jsonPattern)) {
          dispatch(updateLastMessageData({ messageType: MessageType.QUESTION_JSON }));
          isQuestionJson = true;
        }

        fullText += text;
      } else if (type === "workflow_started") {
        dispatch(updateLastMessageData({ messageId }));
      }
    },
    onClose: () => {
      wordLength = splitCustomWords(fullText).length;
      dispatch(updateLastMessageData({ fullText: fullText, loading: false }));
    },
    onError: (error) => console.log("SSE error", error),
  });

  let startStreaming = false;
  const interval = setInterval(() => {
    if (isQuestionJson) clearInterval(interval);

    // Split word every time update to find latest words
    const words = splitCustomWords(fullText);

    // Skip if new text haven't arrived yet
    if (words.length > wordIndex + 1) {
      // Start streaming
      if (!startStreaming) {
        if (!isQuestionJson) dispatch(updateLastMessageData({ loading: false }));
        startStreaming = true;
      }

      const nextWord = words[wordIndex];
      dispatch(updateLastMessageData({ nextWord }));

      wordIndex++;

      // Stop interval at lastword, after original stream is done
      if (wordLength > 0 && wordIndex == words.length - 1) {
        const lastWord = words[wordIndex];
        dispatch(updateLastMessageData({ nextWord: lastWord }));

        const splittedText = fullText.split(Delimiter);
        if (splittedText.length > 3) {
          const suggestionString = splittedText.slice(1);
          const suggestedActions = suggestionString
            .map((text) => {
              // Split by "-" or ":"
              let data = text.split("-");
              if (data.length < 2) data = text.split(":");

              const [id, title] = data;
              return { id: id.trim(), title: title.trim() };
            })
            .filter((action) => action.id !== undefined && action.id !== null && action.title !== undefined && action.title !== null);

          dispatch(updateLastMessageData({ suggestedActions }));
        }

        clearInterval(interval);
      }
    }
  }, 20);
};
