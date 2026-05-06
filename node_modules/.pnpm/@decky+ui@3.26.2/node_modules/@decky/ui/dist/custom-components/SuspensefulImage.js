import { useEffect } from 'react';
import { useState } from 'react';
import { Spinner } from '../components';
export const SuspensefulImage = (props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    useEffect(() => {
        setLoading(true);
        setError(false);
        const img = new Image();
        img.src = props.src || '';
        img.addEventListener('load', () => {
            setLoading(false);
        });
        img.addEventListener('error', () => {
            setError(true);
        });
    }, [props.src]);
    return loading ? (window.SP_REACT.createElement("div", { style: {
            width: props.suspenseWidth || props.style?.width,
            height: props.suspenseHeight || props.style?.height,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        } }, error ? 'Missing image' : window.SP_REACT.createElement(Spinner, { style: { height: '48px' } }))) : (window.SP_REACT.createElement("img", { ...props }));
};
