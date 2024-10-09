import { AppDispatch } from "../../../store";
import { StatusMessageType } from "../types/message.types";

function handleStatusMessageType(
  message: StatusMessageType,
  dispatch: AppDispatch
) {
  console.log(message);
  dispatch(() => {});
}

export default handleStatusMessageType;
