(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./var"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OTT = void 0;
    const var_1 = require("./var");
    function OTT({ candles, period, percent }) {
        period = period || 2;
        percent = percent || 1.4;
        let result = [];
        const varInstance = var_1.VAR({ candles: [], period });
        // stacks
        let longStopPrev;
        const longStopStack = [];
        let dirStackPrev = 1;
        const dirStack = [];
        let shortStopPrev;
        const shortStopStack = [];
        let ottStack = [];
        function calculate(candle) {
            const varResult = varInstance.update(candle);
            if (!varResult)
                return undefined;
            const fark = varResult.value * percent * 0.01;
            let longStop = varResult.value - fark;
            longStopPrev = longStopStack.pop() || longStop;
            longStop =
                varResult.value > longStopPrev
                    ? Math.max(longStop, longStopPrev)
                    : longStop;
            longStopStack.push(longStop);
            let shortStop = varResult.value + fark;
            shortStopPrev = shortStopStack.pop() || shortStop;
            shortStop =
                varResult.value < shortStopPrev
                    ? Math.min(shortStop, shortStopPrev)
                    : shortStop;
            shortStopStack.push(shortStop);
            let dir = 1;
            dirStackPrev = dirStack.pop() || dir;
            dir = dirStackPrev;
            dir =
                // eslint-disable-next-line no-nested-ternary
                dir === -1 && varResult.value > shortStopPrev
                    ? 1
                    : dir === 1 && varResult.value < longStopPrev
                        ? -1
                        : dir;
            dirStack.push(dir);
            const MT = dir === 1 ? longStop : shortStop;
            ottStack.push(varResult.value > MT
                ? (MT * (200 + percent)) / 200
                : (MT * (200 - percent)) / 200);
            const OTT = ottStack[ottStack.length - 3] || 0;
            return {
                candle,
                var: varResult.value,
                ott: OTT,
                time: candle.time,
            };
        }
        candles.forEach((item) => {
            const res = calculate(item);
            if (res)
                result.push(res);
        });
        return {
            result: () => result,
            update: (candle) => {
                if (result.length && result[result.length - 1].time === candle.time) {
                    result = result.slice(0, -1);
                    ottStack = ottStack.slice(0, -1);
                }
                const item = calculate(candle);
                if (item)
                    result.push(item);
                return item;
            },
        };
    }
    exports.OTT = OTT;
});
