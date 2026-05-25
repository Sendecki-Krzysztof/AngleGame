import React, { useEffect, useRef } from 'react';

function AngleCanvas({ targetAngle, guessHistory = [] }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (targetAngle === null) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear the expanded pixel frame buffer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = 130; // Adjusted slightly to fit comfortably in the new card framing

        // Standard baseline angles to match the original layout rotation behavior
        const baselineOffsetAngle = 30 * Math.PI / 180;

        const baseEndX = cx + radius * Math.cos(baselineOffsetAngle);
        const baseEndY = cy + radius * Math.sin(baselineOffsetAngle);

        const terminalEndX = cx + radius * Math.cos(baselineOffsetAngle - (targetAngle * Math.PI) / 180);
        const terminalEndY = cy + radius * Math.sin(baselineOffsetAngle - (targetAngle * Math.PI) / 180);

        // --- 1. Draw Geometric Curved Indicator Arc ---
        ctx.strokeStyle = "#38bdf8"; // Vibrant Sky Blue Arc
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, baselineOffsetAngle, baselineOffsetAngle - (targetAngle * Math.PI) / 180, true);
        ctx.stroke();

        // --- 2. Draw Chronologically Fading Onion-Skin Guess Lines ---
        const totalGuesses = guessHistory.length;

        guessHistory.forEach((attempt, index) => {
            const guessRad = baselineOffsetAngle - (attempt.value * Math.PI) / 180;
            const guessEndX = cx + radius * Math.cos(guessRad);
            const guessEndY = cy + radius * Math.sin(guessRad);

            const ageMultiplier = (index + 1) / totalGuesses;
            const calculatedAlpha = 0.5 * ageMultiplier;

            ctx.strokeStyle = `rgba(129, 140, 248, ${calculatedAlpha})`; // Bright Indigo fade

            if (index === totalGuesses - 1) {
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
            } else {
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 5]);
            }

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(guessEndX, guessEndY);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        // --- 3. Draw Base Reference Ray Line ---
        ctx.strokeStyle = "#f97316"; // Bright Orange Base Ray (Visible on dark backgrounds)
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(baseEndX, baseEndY);
        ctx.stroke();

        // --- 4. Draw Mystery Terminal Arm Vector Ray ---
        ctx.strokeStyle = "#f8fafc"; // Crisp Slate-White for the target ray
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(terminalEndX, terminalEndY);
        ctx.stroke();

        // --- 5. Draw Central Node Vertex Pin ---
        ctx.fillStyle = "#e2e8f0"; // Light slate core pin
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fill();

    }, [targetAngle, guessHistory]);

    return (
        <div className="flex items-center justify-center w-full my-4 bg-transparent">
            <canvas ref={canvasRef} width={400} height={340} className="mx-auto" />
        </div>
    );
}

export default AngleCanvas;