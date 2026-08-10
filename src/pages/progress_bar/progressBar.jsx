import { useCallback, useEffect, useState } from "react";
import "./progressBar.css";

/**
 * This component has 
 * 1 - progress bar
 * 2 - like heart button
 * 3 - Traffic light
*/

export default function ProgressBarContainer() {
    const [barNumber, setBarNumber] = useState(0);

    function addBar() {
        setBarNumber((num) => num + 1);
    }

    function generateProgressBars() {
        let bars = [];
        for (let i = 0; i < barNumber; i++) {
            bars.push(<ProgressBar key={i} />);
        }
        return bars;
    }

    return (
        <div className="main">
            <div className="progress-bar-container">
                <LikeButtonContainer />
                <TrafficLightContainer />
                <button onClick={addBar}>Add bars</button>
                {generateProgressBars()}
            </div>
        </div>
    );
}

function ProgressBar() {
    //animation 2000ms
    return (
        <div className="progress-track">
            <div className="progress-fill" />
        </div>
    );
}

//--------------------------Like button------------------------------/

function LikeButtonContainer(params) {
    return (
        <div className="like-button-container">
            <LikeButton />
        </div>
    );
}

const LikeState = Object.freeze({
    default: 'default',
    liked: 'LIKE',
    loading: 'LOADING',
    failure: 'FAILURE',
});

const API_URL =
    "https://questions.greatfrontend.com/api/questions/like-button";

function LikeButton(params) {
    const [buttonState, setButtonState] = useState(null);
    async function handleClick() {
        if (buttonState === LikeState.loading) {
            return;
        }

        const action = buttonState === LikeState.liked ? 'unlike' : 'like';
        const currentState = buttonState;
        const nextState = buttonState === LikeState.liked ? LikeState.default : LikeState.liked;
        setButtonState(LikeState.loading);

        try {

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    "Content-Type": "applicaton/json",
                },
                body: JSON.stringify({ action }),
            })

            const data = await response.json();

            // fetch 在 HTTP 500 时不会自动抛出错误
            // 所以必须自己检查 response.ok
            if (!response.ok) {
                throw new Error(
                    data.message || `Request failed with status ${response.status}`,
                );
            }

            setButtonState(nextState);
        } catch (error) {
            setButtonState(LikeState.failure);
        }
    };


    function getButtonClass() {
        let buttonClass = 'like-button';
        if (buttonState === LikeState.liked) {
            buttonClass += ' like-button--liked';
        }
        if (buttonState === LikeState.loading) {
            buttonClass += ' like-button--loading';
        }

        return buttonClass;

    }

    return <button onClick={handleClick} className={getButtonClass()}>{buttonState === LikeState.loading ? <SpinnerIcon className="like-button__icon" /> : <HeartIcon className="like-button__icon" />} Like</button>;
}

function SpinnerIcon({ className }) {
    return (
        <svg
            className={className}
            width={16}
            height={16}
            viewBox="0 0 38 38"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
        >
            <g fill="none" fillRule="evenodd">
                <g transform="translate(1 1)" strokeWidth="2">
                    <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                    <path d="M36 18c0-9.94-8.06-18-18-18">
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 18 18"
                            to="360 18 18"
                            dur="1s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
            </g>
        </svg>
    );
}

function HeartIcon({ className }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 24 24"
            width="16"
            height="16"
        >
            <g>
                <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"></path>
            </g>
        </svg>
    );
}

/*----------------------------------------------------Traffic light--------------------------------------------------------*/

const LightStatus = {
    green: {
        next: 'yellow',
        duration: 3000,
    },
    yellow: {
        next: 'red',
        duration: 500,
    },
    red: {
        next: 'green',
        duration: 4000,
    }
}

function TrafficLightContainer(params) {
    // red, yellow, green
    const [color, setColor] = useState('green');
    useEffect(() => {
        const {next, duration} = LightStatus[color];

        const timerId = setTimeout(() => {
            setColor(next);
        }, duration);

        return () => clearTimeout(timerId);
    }, [color]);
    return (
        <div className='traffic-light-container'>
            <GreenLight isActive={color === 'green'} />
            <YellowLight isActive={color === 'yellow'} />
            <RedLight isActive={color === 'red'} />
        </div>
    )
}

function RedLight({ isActive }) {
    const activeRedLight = isActive ? 'red-active' : '';
    return (<div className={`traffic-light red ${activeRedLight}`} />)
}

function YellowLight({ isActive }) {
    const activeYellow = isActive ? 'yellow-active' : '';
    return (<div className={`traffic-light yellow ${activeYellow}`} />)
}

function GreenLight({ isActive }) {
    const activeGreen = isActive ? 'green-active' : ''
    return (<div className={`traffic-light green ${activeGreen}`} />)
}


