import { AppDispatch } from "../../../store";
import { IOMessageType } from "../types/message.types";

function handleIOMessageStatus(message: IOMessageType, dispatch: AppDispatch) {
  // const payload = message.payload;

  dispatch(() => {});
}

export default handleIOMessageStatus;
