import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import store, { RootState } from "../store";

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
