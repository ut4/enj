
declare module 'inferno-vnode-flags' {
    enum VNodeFlags {
        Text = 1,
        HtmlElement = 2,
        ComponentClass = 4,
        ComponentFunction = 8,
        ComponentUnknown = 16,
        HasKeyedChildren = 32,
        HasNonKeyedChildren = 64,
        SvgElement = 128,
        MediaElement = 256,
        InputElement = 512,
        TextareaElement = 1024,
        SelectElement = 2048,
        Void = 4096,
        FormElement = 3584,
        Element = 3970,
        Component = 28,
    }
    export default VNodeFlags;
}
