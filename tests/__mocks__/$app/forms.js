// Minimal $app/forms stub so components using `use:enhance` (AdminModal, the
// init page) can be imported in the vitest jsdom environment. `enhance` is a
// no-op Svelte action — the form keeps its native submission behavior, and the
// action's returned update/destroy function is a harmless no-op.
export const enhance = () => () => {}
export const applyAction = () => {}
export const deserialize = (value) => JSON.parse(value)
