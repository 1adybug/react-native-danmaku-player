/// <reference types="react" />
import { StyleProp, ViewProps, ViewStyle } from "react-native";
import { VideoProperties } from "react-native-video";
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
}
export declare function DanmakuPeriod(props: DanmakuPeriodProps): JSX.Element;
interface DanmakuProps {
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
}
interface DanmakuPlayerProps {
    wrapperProps: ViewProps;
    danmakuProps: DanmakuProps;
    videoProps: VideoProperties;
}
export default function DanmakuPlayer(props: DanmakuPlayerProps): JSX.Element;
export {};
