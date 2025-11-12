import { getFiberNode } from './getFiberNode';

export type FiberInstanceChildren = { name: string; type: 'dom' | 'Component' };

export type FiberInstanceProps = Record<string, unknown> & {
  children: FiberInstanceChildren[];
};

export interface FiberInstance {
  state: { current: string; previous: string };
  props: FiberInstanceProps;
}

export type FiberInstances = Record<string, FiberInstance[]>;

const mutateChildren = (children: any[]) => {
  const childrenType = typeof children;
  const isArray = Array.isArray(children);

  if (isArray) {
    return children
      ?.map((child) => {
        const type = typeof child;
        if (child == null) {
          return undefined;
        }
        if (type === 'string' || type === 'number') {
          return { name: typeof child, type: 'dom' };
        }
        if (typeof child?.type === 'string') {
          return { name: child?.type, type: 'dom' };
        }
        return { name: child?.type?.name, type: 'Component' };
      })
      .filter((a) => a !== undefined);
  }

  console.log("Doesn't meet the traditional children", children);

  if (!isArray && childrenType === 'object') {
    return {
      name: (children as { type?: { name?: string } })?.type?.name,
      type: 'Component',
    };
  }

  if (childrenType === 'string') {
    return { name: children as string, type: 'dom' };
  }
};

export const getFiberInstances = () => {
  const allElements = Array.from(document.querySelectorAll('*'));
  const values: FiberInstances = {};

  const reactNodes = allElements.filter((k: Element) =>
    Object.keys(k).find((ok) => ok.startsWith('__reactFiber'))
  );

  for (const node of reactNodes) {
    const keys = Object.keys(node);
    const attr = keys.filter((k) => k.startsWith('__react'));
    const component = getFiberNode(node);
    const state = component?.memoizedState;
    const propsKey = attr.find((k) => k.toLocaleLowerCase().includes('props'));
    const props = (node as any)[propsKey || ''];

    if (component != null) {
      const componentName: string = component?.type?.name;
      values[componentName] = values[componentName] ?? [];

      const shouldMutateChildren = typeof props?.children === 'object';

      delete props.ref;
      const baseState = { ...(state?.baseState ?? state?.memoizedState) };
      const previousState = state?.queue?.lastRenderedState ?? undefined;

      if (baseState.current instanceof HTMLElement) {
        baseState.current = 'unsupported:useRef';
      }

      if (previousState?.current instanceof HTMLElement) {
        previousState.current = 'unsupported:useRef';
      }

      const current = JSON.stringify(baseState);
      const previous = JSON.stringify(previousState);

      values[componentName].push({
        state: {
          current,
          previous,
        },
        props: {
          ...props,
          children: shouldMutateChildren
            ? mutateChildren(props?.children)
            : props?.children,
        },
      });
    }
  }

  return values;
};
