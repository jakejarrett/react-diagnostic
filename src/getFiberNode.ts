interface FiberNode extends Element {
    _instance: unknown;
    return?: any;
}

export const getFiberNode = (dom: Element) => {
    const key = Object.keys(dom).find(key => key.startsWith("__reactFiber$"));
    const domFiber: FiberNode = (dom as any)[key as string];
    if (domFiber == null) return null;

    let parentFiber = domFiber.return;
    while (typeof parentFiber.type == "string") {
        parentFiber = parentFiber.return;
    }
    return parentFiber;
}