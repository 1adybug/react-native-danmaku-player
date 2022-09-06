/// <reference types="react" />
import { StyleProp, ViewStyle } from "react-native";
export interface DanmakuItemRawData {
    content: string;
    color: string;
    timestamp: number;
    id: number;
}
export interface DanmakuItemShowData {
    content: string;
    color: string;
    left: number;
    top: number;
    lineHeight: number;
    fontSize: number;
    id: number;
}
export interface GetDanmakuPositionConfig {
    data: DanmakuItemRawData[];
    startTimeStamp: number;
    endTimeStamp: number;
    width: number;
    height: number;
    lineHeight: number;
    fontSize: number;
}
export declare function getDanmakuPosition(config: GetDanmakuPositionConfig): DanmakuItemShowData[];
export interface DanmakuPeriodProps {
    data: DanmakuItemRawData[];
    startTimeStamp: number;
    endTimeStamp: number;
    lineHeight: number;
    fontSize: number;
    wrapperWidth: number;
    wrapperHeight: number;
    duration: number;
    paused: boolean;
    textShadowColor?: string;
    textShadowRadius?: number;
}
export declare function DanmakuPeriod(props: DanmakuPeriodProps): JSX.Element;
export interface DanmakuPlayerProps {
    width: number;
    height: number;
    period: number;
    duration: number;
    judge?: number;
    ahead?: number;
    style?: StyleProp<ViewStyle>;
    fontSize: number;
    lineHeight: number;
    getDanmakuMethod: (startTimeStamp: number, endTimeStamp: number) => Promise<DanmakuItemRawData[]>;
    paused: boolean;
    currentTime: number;
    textShadowColor?: string;
    textShadowRadius?: number;
}
export default function DanmakuPlayer(props: DanmakuPlayerProps): JSX.Element;
