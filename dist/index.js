"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanmakuPeriod = exports.getDanmakuPosition = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
function getDanmakuPosition(config) {
    const { data, startTimeStamp, endTimeStamp, width, height, lineHeight, fontSize } = config;
    const columnCount = Math.floor(height / lineHeight);
    const msWidth = width / (endTimeStamp - startTimeStamp);
    return data
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((value, index) => {
        const { content, color, timestamp, id } = value;
        return {
            content: content,
            color: color,
            left: (timestamp - startTimeStamp) * msWidth,
            top: (index % columnCount) * lineHeight,
            lineHeight,
            fontSize,
            id
        };
    });
}
exports.getDanmakuPosition = getDanmakuPosition;
function DanmakuPeriod(props) {
    const { data, startTimeStamp, endTimeStamp, lineHeight, fontSize, wrapperWidth, wrapperHeight, duration, paused, textShadowColor, textShadowRadius } = props;
    const period = endTimeStamp - startTimeStamp;
    const speed = wrapperWidth / duration;
    const width = speed * period;
    const showList = (0, react_1.useMemo)(() => getDanmakuPosition({ startTimeStamp, endTimeStamp, data, width, height: wrapperHeight, fontSize, lineHeight }), [startTimeStamp, endTimeStamp, data, width, wrapperHeight, fontSize, lineHeight]);
    const translateX = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const animation = (0, react_1.useRef)(react_native_1.Animated.timing(translateX, {
        toValue: -2 * wrapperWidth,
        duration: duration * 2,
        useNativeDriver: true,
        easing: react_native_1.Easing.linear
    })).current;
    (0, react_1.useEffect)(() => {
        if (paused) {
            animation.stop();
        }
        else {
            animation.start();
        }
    }, [paused]);
    return (react_1.default.createElement(react_native_1.Animated.View, { style: { position: "absolute", left: wrapperWidth, width, height: wrapperHeight, top: 0, transform: [{ translateX }] } }, showList.map(value => {
        const { content, color, left, top, lineHeight, fontSize, id } = value;
        return (react_1.default.createElement(react_native_1.Text, { key: id, style: { position: "absolute", top, color, left, lineHeight, fontSize, textShadowColor, textShadowRadius } }, content));
    })));
}
exports.DanmakuPeriod = DanmakuPeriod;
const DanmakuArea = (0, react_1.memo)(function (props) {
    const { style, width, height, showPeriodDataList, duration, period, currentPeriodCount, paused, random, fontSize, lineHeight, textShadowColor, textShadowRadius } = props;
    return (react_1.default.createElement(react_native_1.View, { style: { left: 0, top: 0, ...(style || {}), width, height } }, Object.keys(showPeriodDataList)
        .filter(key => {
        const index = Number(key);
        return index + (duration * 2) / period >= currentPeriodCount && index <= currentPeriodCount;
    })
        .map(key => {
        const index = Number(key);
        return react_1.default.createElement(DanmakuPeriod, { paused: paused, key: `${random}${key}`, wrapperWidth: width, duration: duration, startTimeStamp: index * period, endTimeStamp: (index + 1) * period, wrapperHeight: height, fontSize: fontSize, lineHeight: lineHeight, data: showPeriodDataList[index], textShadowColor: textShadowColor, textShadowRadius: textShadowRadius });
    })));
});
function DanmakuPlayer(props) {
    const { width, height, duration, period, style, judge, ahead, getDanmakuMethod, fontSize, lineHeight, paused, currentTime, textShadowColor, textShadowRadius } = props;
    const storageTime = (0, react_1.useRef)(currentTime);
    // ?????????????????????????????????
    const [random, setRandom] = (0, react_1.useState)(Date.now());
    const [currentPeriodCount, setCurrentPeriodCount] = (0, react_1.useState)(-1);
    const [periodDataList, setPeriodDataList] = (0, react_1.useState)({});
    const [showPeriodDataList, setShowPeriodDataList] = (0, react_1.useState)({});
    const requestList = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (Math.abs(currentTime - storageTime.current) > (judge || 1000)) {
            setRandom(Date.now());
            setShowPeriodDataList({});
        }
        storageTime.current = currentTime;
        const periodCount = Math.floor(currentTime / period);
        setCurrentPeriodCount(periodCount);
        for (let i = periodCount; i <= periodCount + (ahead || 1); i++) {
            if (!periodDataList[i] && !requestList.current.includes(i)) {
                requestList.current.push(i);
                getDanmakuMethod(i * period, (i + 1) * period)
                    .then(list => {
                    periodDataList[i] = list;
                    setPeriodDataList({ ...periodDataList });
                })
                    .catch(console.error);
            }
        }
        if (!showPeriodDataList[periodCount] && periodDataList[periodCount]) {
            showPeriodDataList[periodCount] = periodDataList[periodCount];
            setShowPeriodDataList({ ...showPeriodDataList });
        }
    }, [currentTime]);
    return react_1.default.createElement(DanmakuArea, { width: width, height: height, lineHeight: lineHeight, fontSize: fontSize, style: style, period: period, duration: duration, paused: paused, showPeriodDataList: showPeriodDataList, currentPeriodCount: currentPeriodCount, random: random, textShadowColor: textShadowColor, textShadowRadius: textShadowRadius });
}
exports.default = DanmakuPlayer;
//# sourceMappingURL=index.js.map