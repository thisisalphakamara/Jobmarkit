import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check if MediaRecorder is supported
  useEffect(() => {
    const checkSupport = () => {
      try {
        if (
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia &&
          window.MediaRecorder
        ) {
          setIsSupported(true);
          setError(null);
        } else {
          setIsSupported(false);
          setError("Media recorder not supported in this browser");
        }
      } catch (error) {
        setIsSupported(false);
        setError("Media recorder not supported in this browser");
      }
    };
    checkSupport();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      toast.error("Voice recording not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Try different MIME types for better browser compatibility
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : {}
      );

      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const blob = new Blob(chunks, {
            type: chunks[0]?.type || "audio/webm",
          });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
        } catch (error) {
          console.error("Error processing recording:", error);
          setIsRecording(false);
          setIsPaused(false);
          setRecordingTime(0);
          toast.error("Failed to process voice recording");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        toast.error("Voice recording error occurred");
      };

      mediaRecorder.start(1000); // Collect data every second for better UX
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      toast.info("Voice recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      toast.error(
        "Failed to start voice recording. Please check microphone permissions."
      );
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && isRecording && !isPaused) {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      } else if (mediaRecorderRef.current && isRecording && isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      }
    } catch (error) {
      console.error("Error pausing/resuming recording:", error);
    }
  }, [isRecording, isPaused]);

  const clearRecording = useCallback(() => {
    try {
      setAudioBlob(null);
      setAudioUrl(null);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      console.error("Error clearing recording:", error);
    }
  }, [audioUrl, isRecording]);

  const getAudioBlob = useCallback(() => {
    return audioBlob;
  }, [audioBlob]);

  const getRecordingDuration = useCallback(() => {
    return recordingTime;
  }, [recordingTime]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    isSupported,
    error,
    recordingTime,
    isPaused,
    formatTime,
    startRecording,
    stopRecording,
    pauseRecording,
    clearRecording,
    getAudioBlob,
    getRecordingDuration,
  };
};
