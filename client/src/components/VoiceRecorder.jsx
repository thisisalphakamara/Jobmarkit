import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, X, Send, RotateCcw } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

const VoiceRecorder = ({ onSend, onCancel, disabled = false }) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    isSupported,
    recordingTime,
    isPaused,
    formatTime,
    startRecording,
    stopRecording,
    pauseRecording,
    clearRecording,
    getAudioBlob,
  } = useVoiceRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);

  // Create audio element for playback
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      setAudioElement(audio);
    }
  }, [audioUrl]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    const blob = getAudioBlob();
    if (blob && onSend) {
      onSend(blob);
      clearRecording();
    }
  };

  const handleCancel = () => {
    clearRecording();
    if (onCancel) {
      onCancel();
    }
  };

  const handleRetry = () => {
    clearRecording();
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <AnimatePresence mode="wait">
        {/* Initial State - Start Recording */}
        {!isRecording && !audioBlob && (
          <motion.button
            key="start"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleStartRecording}
            disabled={disabled}
            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            title="Start voice recording"
          >
            <Mic size={20} />
          </motion.button>
        )}

        {/* Recording State */}
        {isRecording && (
          <motion.div
            key="recording"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-full px-4 py-2"
          >
            {/* Recording indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Recording controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={pauseRecording}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                onClick={handleStopRecording}
                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Stop recording"
              >
                <Square size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Recorded Audio State */}
        {audioBlob && !isRecording && (
          <motion.div
            key="recorded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-full px-4 py-2"
          >
            {/* Playback controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayPause}
                className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="text-sm font-medium text-green-700">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSend}
                disabled={disabled}
                className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send voice message"
              >
                <Send size={16} />
              </button>
              <button
                onClick={handleRetry}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                title="Record again"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecorder;
