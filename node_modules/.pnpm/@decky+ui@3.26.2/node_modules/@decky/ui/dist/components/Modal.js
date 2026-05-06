import { findSP } from '../utils';
import { findModule, findModuleByExport, findModuleExport } from '../webpack';
const showModalRaw = findModuleExport((e) => typeof e === 'function' && e.toString().includes('props.bDisableBackgroundDismiss') && !e?.prototype?.Cancel);
export const showModal = (modal, parent, props = {
    strTitle: 'Decky Dialog',
    bHideMainWindowForPopouts: false,
}) => {
    return showModalRaw(modal, parent || findSP(), props.strTitle, props, undefined, {
        bHideActions: props.bHideActionIcons,
    });
};
export const ConfirmModal = findModuleExport((e) => !e?.prototype?.OK && e?.prototype?.Cancel && e?.prototype?.render);
export const ModalRoot = Object.values(findModule((m) => {
    if (typeof m !== 'object')
        return false;
    for (let prop in m) {
        if (m[prop]?.m_mapModalManager && Object.values(m)?.find((x) => x?.type)) {
            return true;
        }
    }
    return false;
}) || {})?.find((x) => x?.type?.toString()?.includes('((function(){'));
const ModalModule = findModuleByExport((e) => e?.toString().includes('.ModalPosition,fallback:'), 5);
const ModalModuleProps = ModalModule ? Object.values(ModalModule) : [];
export const SimpleModal = ModalModuleProps.find((prop) => {
    const string = prop?.toString();
    return string?.includes('.ShowPortalModal()') && string?.includes('.OnElementReadyCallbacks.Register(');
});
export const ModalPosition = ModalModuleProps.find((prop) => prop?.toString().includes('.ModalPosition,fallback:'));
