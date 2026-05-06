import { findModule } from '../webpack';
export const DialogCheckbox = Object.values(findModule((m) => {
    if (typeof m !== 'object')
        return false;
    for (const prop in m) {
        if (m[prop]?.prototype?.GetPanelElementProps)
            return true;
    }
    return false;
})).find((m) => m.contextType &&
    m.prototype?.render.toString().includes('fallback:') &&
    m?.prototype?.SetChecked &&
    m?.prototype?.Toggle &&
    m?.prototype?.GetPanelElementProps);
