import { getFiberNode } from "./getFiberNode";

export type FiberInstanceChildren = { name: string; type: "dom" | "Component" };

export type FiberInstanceProps = Record<string, unknown> & {
    children: FiberInstanceChildren[]
}

export interface FiberInstance {
    state: { current: string; previous: string; };
    props: FiberInstanceProps;
}

export type FiberInstances = Record<string, FiberInstance[]>;

const mutateChildren = (children: any[]) => {
    return children?.map((child: any) => {
        const type = typeof child;
        if (child == null) {
            return undefined;
        }

        if (type === 'string' || type === 'number') {
            return { name: typeof child, type: "dom" };
        }

        if (typeof child?.type === 'string') {
            return { name: child?.type, type: 'dom' };
        }

        return { name: child?.type?.name, type: 'Component' };
    }).filter(a => a !== undefined);
}

export const getFiberInstances = () => {
    const allElements = [...document.querySelectorAll('*')];
    const values: FiberInstances = {};

    const reactNodes = allElements.filter((k: Element) => Object.keys(k).find(ok => ok.startsWith('__reactFiber')));

    for (const node of reactNodes) {
        const keys = Object.keys(node);
        const attr = keys.filter(k => k.startsWith('__react'));
        const component = getFiberNode(node);
        const state = component?.memoizedState;
        const propsKey = attr.find(k => k.toLocaleLowerCase().includes('props'));
        const props = (node as any)[propsKey || ''];


        if (component != null) {
            const componentName: string = component?.type?.name;
            values[componentName] = values[componentName] ?? [];

            const shouldMutateChildren = typeof props?.children === "object";

            values[componentName].push({
                state: {
                    current: JSON.stringify(state?.baseState ?? state?.memoizedState),
                    previous: JSON.stringify(state.queue?.lastRenderedState ?? undefined),
                }, props: {
                    ...props, children: shouldMutateChildren ? mutateChildren(props?.children) : props?.children
                }
            });
        }
    }

    return values;
};