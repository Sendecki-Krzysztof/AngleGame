import React, { useEffect, useRef } from 'react';

function AngleCanvas({ targetAngle, guessHistory = [] }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (targetAngle === null) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear the expanded pixel frame buffer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Proportional scaling math for the larger canvas bounds
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = 150; // Increased from 95 to stretch across the new space

        // Standard baseline angles to match the original layout rotation behavior
        const baselineOffsetAngle = 30 * Math.PI / 180;

        const baseEndX = cx + radius * Math.cos(baselineOffsetAngle);
        const baseEndY = cy + radius * Math.sin(baselineOffsetAngle);

        const terminalEndX = cx + radius * Math.cos(baselineOffsetAngle - (targetAngle * Math.PI) / 180);
        const terminalEndY = cy + radius * Math.sin(baselineOffsetAngle - (targetAngle * Math.PI) / 180);

        // --- 1. Draw Geometric Curved Indicator Arc ---
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2; // Slightly thicker line to match scale
        ctx.beginPath();
        // Scaled the inner arc radius up to 40 so it's clearly visible
        ctx.arc(cx, cy, 40, baselineOffsetAngle, baselineOffsetAngle - (targetAngle * Math.PI) / 180, true);
        ctx.stroke();

        // --- 2. Draw Chronologically Fading Onion-Skin Guess Lines ---
        const totalGuesses = guessHistory.length;

        guessHistory.forEach((attempt, index) => {
            const guessRad = baselineOffsetAngle - (attempt.value * Math.PI) / 180;
            const guessEndX = cx + radius * Math.cos(guessRad);
            const guessEndY = cy + radius * Math.sin(guessRad);

            const ageMultiplier = (index + 1) / totalGuesses;
            const calculatedAlpha = 0.45 * ageMultiplier;

            ctx.strokeStyle = `rgba(99, 102, 241, ${calculatedAlpha})`;

            if (index === totalGuesses - 1) {
                ctx.lineWidth = 3.5; // Thicker active guess line
                ctx.setLineDash([]);
            } else {
                ctx.lineWidth = 2; // Sharper historical tracker lines
                ctx.setLineDash([3, 5]);
            }

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(guessEndX, guessEndY);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        // --- 3. Draw Base Reference Ray Line ---
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 3.5; // Scaled up thickness
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(baseEndX, baseEndY);
        ctx.stroke();

        // --- 4. Draw Mystery Terminal Arm Vector Ray ---
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(terminalEndX, terminalEndY);
        ctx.stroke();

        // --- 5. Draw Central Node Vertex Pin ---
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI); // Scaled anchor hub up to 6px radius
        ctx.fill();

    }, [targetAngle, guessHistory]);

    return (
        <div className="flex items-center justify-center w-full my-6 bg-transparent">
            {/* Expanded frame dimensions from 260x240 to 400x360 */}
            <canvas ref={canvasRef} width={400} height={360} className="mx-auto" />
        </div>
    );
}

export default AngleCanvas;