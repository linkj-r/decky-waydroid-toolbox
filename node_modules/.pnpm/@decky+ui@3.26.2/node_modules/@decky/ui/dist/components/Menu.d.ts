import { FC, ReactNode } from 'react';
import { FooterLegendProps } from './FooterLegend';
export declare const showContextMenu: (children: ReactNode, parent?: EventTarget) => void;
export interface MenuProps extends FooterLegendProps {
    label: string;
    onCancel?(): void;
    cancelText?: string;
    children?: ReactNode;
}
export declare const Menu: FC<MenuProps>;
export interface MenuGroupProps {
    label: string;
    disabled?: boolean;
    children?: ReactNode;
}
export declare const MenuGroup: FC<MenuGroupProps>;
export interface MenuItemProps extends FooterLegendProps {
    bInteractableItem?: boolean;
    onClick?(evt: Event): void;
    onSelected?(evt: Event): void;
    onMouseEnter?(evt: MouseEvent): void;
    onMoveRight?(): void;
    selected?: boolean;
    disabled?: boolean;
    bPlayAudio?: boolean;
    tone?: 'positive' | 'emphasis' | 'destructive';
    children?: ReactNode;
}
export declare const MenuItem: FC<MenuItemProps>;
