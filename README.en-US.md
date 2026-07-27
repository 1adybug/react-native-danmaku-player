# React-Native-Danmaku-Player

## Introduction

For a long time, there haven't been many good danmaku (bullet chat) components for the React Native platform; they are either no longer updated or unusable. Additionally, the English-speaking web doesn't have a strong habit of using danmaku, which is why I wrote this component.

## Type Declarations

<!-- Types Start -->
```TypeScript
import { ComponentProps } from "react";
import { StyleProp, TextStyle, View } from "react-native";

/** Raw data for a danmaku item */
export interface DanmakuItemRawData {

    /** Text content */
    content: string;

    /** Timestamp */
    timestamp: number;

    /** Unique identifier */
    id: number;
}

/** Data for rendering a danmaku item */
export interface DanmakuItemShowData<T extends DanmakuItemRawData> {

    /** Raw danmaku data */
    data: T;

    /** Top margin */
    top: number;

    /** Line height */
    lineHeight: number;

    /** Font size */
    fontSize: number;
}

/** Configuration for calculating danmaku positions */
export interface GetDanmakuPositionConfig<T extends DanmakuItemRawData> {

    /** Array of raw danmaku data */
    data: T[];

    /** Height of the danmaku area */
    height: number;

    /** Line height of the danmaku */
    lineHeight: number;

    /** Font size of the danmaku */
    fontSize: number;
}

/** Generates positions for danmaku items */
export declare function getDanmakuPosition<T extends DanmakuItemRawData>(config: GetDanmakuPositionConfig<T>): DanmakuItemShowData<T>[];

/** Asynchronous function used to fetch danmaku data */
export type DanmakuDataLoader<T extends DanmakuItemRawData> = (

/**
 * Start timestamp of the danmaku cycle, in milliseconds
 */
startTimeStamp: number, 

/**
 * End timestamp of the danmaku cycle, in milliseconds
 */
endTimeStamp: number) => Promise<T[]>;

/** Set the style of the danmaku */
export type GetDanmakuStyle<T extends DanmakuItemRawData> = (danmaku: T) => StyleProp<TextStyle>;

/** Base configuration for the Danmaku Player */
export type DanmakuPlayerBaseProps<T extends DanmakuItemRawData> = {

    /**
     * The danmaku cycle, in milliseconds.
     *
     * For example: if set to 10000, the player will request danmaku between 0ms - 10000ms when playback starts, render them, and move them to the left. Then it will request 10000ms - 20000ms, and so on. Smaller values will result in more frequent network requests.
     */
    period: number;

    /** Interval for a danmaku to travel from right to left, in milliseconds */
    lifetime: number;

    /** Total video duration, in milliseconds */
    duration: number;

    /**
     * Video playback speed
     *
     * @default 1
     */
    rate?: number;

    /**
     * Threshold for sudden changes in video time, in milliseconds.
     *
     * This determines if the user has manually operated the seek bar. If the time jump exceeds this threshold, the danmaku animations will be recalculated and restarted.
     *
     * @default 1000
     */
    threshold?: number;

    /** Asynchronous function to fetch danmaku data. Accepts start time and end time as arguments, and returns raw danmaku data. */
    loader: DanmakuDataLoader<T>;

    /**
     * Number of cycles to preload.
     *
     * For example, if the current cycle is 5 and preload is 2, then danmaku for cycles 5, 6, and 7 will be loaded.
     *
     * @default 1
     */
    preload?: number;

    /** Whether playback is paused */
    paused: boolean;

    /** Current video progress timestamp, in milliseconds */
    current: number;

    /** Danmaku font size */
    fontSize: number;

    /** Danmaku line height; recommended to be 1.5x or 2x the font size */
    lineHeight: number;

    /**
     * Danmaku style
     *
     * Can be a style object or a function. If a function, it takes raw danmaku data as an argument and returns a style object.
     */
    danmakuStyle?: StyleProp<TextStyle> | GetDanmakuStyle<T>;

    /**
     * Container width
     */
    width: number;

    /**
     * Container height
     */
    height: number;
};

/** Danmaku Player configuration */
export type DanmakuPlayerProps<T extends DanmakuItemRawData> = Omit<DanmakuPlayerBaseProps<T>, "width" | "height"> & Omit<ComponentProps<typeof View>, "children">;

/** Underlying Danmaku Player component */
export declare function DanmakuPlayerBase<T extends DanmakuItemRawData>(props: DanmakuPlayerBaseProps<T>): import("react").JSX.Element;

/** Danmaku Player component */
export default function DanmakuPlayer<T extends DanmakuItemRawData>(props: DanmakuPlayerProps<T>): import("react").JSX.Element;
```
<!-- Types End -->

## Usage

It is recommended to use this in conjunction with `react-native-video`.

**Note: Time units in `react-native-video` are in seconds, whereas this plugin uses milliseconds. Please ensure you convert between the two!**

Project Demo:

```tsx
import { FC, useState } from "react"
import { useWindowDimensions, View } from "react-native"
import DanmakuPlayer from "react-native-danmaku-player"
import Video from "react-native-video"

const App: FC = () => {
    const { width, height } = useWindowDimensions()

    // Control video and danmaku playback/pause together
    const [paused, setPaused] = useState(false)

    // Current time point, in milliseconds
    const [current, setCurrent] = useState(0)

    // Video duration
    const [duration, setDuration] = useState(0)

    return (
        <View style={{ width, height }}>
            <Video
                paused={paused}
                source={{ uri: "your video source" }}
                style={{ width, height, backgroundColor: "black" }}
                onProgress={e => setCurrent(e.current * 1000)}
                onLoad={e => setDuration(e.duration * 1000)}
            />
            <DanmakuPlayer
                period={22000}
                lifetime={15000}
                fontSize={18}
                lineHeight={24}
                paused={paused}
                current={current}
                duration={duration}
                style={{ position: "absolute", left: 0, top: 0 }}
                // Pass your async function here, it will be called every cycle
                loader={(start: number, end: number) => getDanmaku(start, end)}
                danmakuStyle={item => ({ color: item.color })}
            />
        </View>
    )
}

export default App
```
