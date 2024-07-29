export const getFps = () => new Promise(resolve => {
    let repaint = 0;
    const start = performance.now();
    const withRepaint = () => {
        requestAnimationFrame(() => {
            if ((performance.now() - start) < 1000) {
                repaint += 1;
                withRepaint();
            } else {
                resolve(repaint);
            }
        });
    };
    withRepaint();
});