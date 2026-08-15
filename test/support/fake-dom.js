// A stand-in for the few DOM calls a small renderer makes, so building an
// element can be checked without a browser. It records what was built, it does
// not behave like a page.

export class FakeNode {
  constructor(tag, namespace = null) {
    this.tag = tag;
    this.namespace = namespace;
    this.attributes = {};
    this.children = [];
    /** Text appended as a plain string, which is how a label arrives. */
    this.text = '';
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === 'string') this.text += node;
      else this.children.push(node);
    }
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.text = '';
    this.append(...nodes);
  }

  /** Every descendant with this tag, so a test can ask what was drawn. */
  find(tag) {
    return this.children.flatMap((child) => [
      ...(child.tag === tag ? [child] : []),
      ...child.find(tag),
    ]);
  }
}

export function installFakeDocument() {
  globalThis.document = {
    createElement: (tag) => new FakeNode(tag),
    createElementNS: (namespace, tag) => new FakeNode(tag, namespace),
  };
}
