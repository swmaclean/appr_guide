import { useState, useRef, useEffect, useCallback } from "react";
import { useDrive } from "./useDrive.js";

export default function APPRApp() {
  const [screen, setScreen] = useState("home");
  const [active, setActive] = useState("home");
  const [detail, setDetail] = useState(null);
  const [checked, setChecked] = useState({});

  const [flightInput, setFlightInput] = useState("");
  const [flightData, setFlightData] = useState(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const [recentFlights, setRecentFlights] = useState([]);

  const [evTab, setEvTab] = useState("audio");
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [evidence, setEvidence] = useState([]);
  const [recLabel, setRecLabel] = useState("");
  const [recFlight, setRecFlight] = useState("");
  const [photoLabel, setPhotoLabel] = useState("");
  const [photoFlight, setPhotoFlight] = useState("");

  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const photoInputRef = useRef(null);

  const recSecsRef = useRef(0);
  const recStartedAtRef = useRef(null);
  const evidenceRef = useRef([]);

  const drive = useDrive();

  useEffect(() => {
    recSecsRef.current = recSecs;
  }, [recSecs]);

  useEffect(() => {
    evidenceRef.current = evidence;
  }, [evidence]);

  const stopRec = useCallback(() => {
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      mediaRecRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }, []);

  const goTo = useCallback((s) => {
    if (recording) stopRec();
    setActive(s);
    setScreen(s);
    setDetail(null);
  }, [recording, stopRec]);

  const searchFlight = useCallback(async () => {
    if (!flightInput.trim()) return;
    setFlightLoading(true);
    setFlightData(null);

    try {
      const r = await lookupFlight(flightInput);
      setFlightData(r);
      setRecentFlights((p) => [r, ...p.filter((f) => f.flightNo !== r.flightNo)].slice(0, 5));
    } finally {
      setFlightLoading(false);
    }
  }, [flightInput]);

  const startRec = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });

      chunksRef.current = [];
      recStartedAtRef.current = Date.now();
      recSecsRef.current = 0;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const ts = new Date();
        const elapsedSecs = recStartedAtRef.current
          ? Math.max(0, Math.round((Date.now() - recStartedAtRef.current) / 1000))
          : recSecsRef.current;

        const flight = recFlight || flightData?.flightNo || "";
        const airline = flightData?.airline || "";
        const label = recLabel || `Recording ${ts.toLocaleTimeString()}`;
        const fname = `APPR_Audio_${flight ? `${flight}_` : ""}${airline ? `${airline.replace(/\s/g, "")}_` : ""}${ts.toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;

        setEvidence((p) => [
          {
            id: Date.now(),
            type: "audio",
            url,
            blob,
            label,
            flight,
            airline,
            fname,
            ts: ts.toLocaleString(),
            duration: fmt(elapsedSecs),
          },
          ...p,
        ]);

        stream.getTracks().forEach((t) => t.stop());
        mediaRecRef.current = null;
        recStartedAtRef.current = null;
      };

      mr.start(1000);
      mediaRecRef.current = mr;
      setRecording(true);
      setRecSecs(0);

      timerRef.current = setInterval(() => {
        setRecSecs((s) => s + 1);
      }, 1000);
    } catch {
      alert("Microphone access required. Please allow in browser settings.");
    }
  }, [flightData, recFlight, recLabel]);

  useEffect(() => {
    return () => {
      stopRec();
    };
  }, [stopRec]);

  useEffect(() => {
    if (screen !== "evidence" && recording) {
      stopRec();
    }
  }, [screen, recording, stopRec]);

  useEffect(() => {
    return () => {
      for (const ev of evidenceRef.current) {
        if (ev.url) URL.revokeObjectURL(ev.url);
      }
    };
  }, []);

  const handlePhoto = useCallback((e) => {
    Array.from(e.target.files || []).forEach((file) => {
      const url = URL.createObjectURL(file);
      const ts = new Date();
      const flight = photoFlight || flightData?.flightNo || "";
      const airline = flightData?.airline || "";
      const label = photoLabel || file.name;
      const fname = `APPR_Photo_${flight ? `${flight}_` : ""}${airline ? `${airline.replace(/\s/g, "")}_` : ""}${ts.toISOString().slice(0, 19).replace(/:/g, "-")}_${file.name}`;

      setEvidence((p) => [
        {
          id: Date.now() + Math.random(),
          type: "photo",
          url,
          file,
          label,
          flight,
          airline,
          fname,
          ts: ts.toLocaleString(),
        },
        ...p,
      ]);
    });

    e.target.value = "";
  }, [photoFlight, photoLabel, flightData]);

  const deleteEv = useCallback((id) => {
    setEvidence((p) => {
      const item = p.find((e) => e.id === id);
      if (item?.url) URL.revokeObjectURL(item.url);
      return p.filter((e) => e.id !== id);
    });
  }, []);

  const sc = flightData
    ? flightData.status.toLowerCase().includes("active")
      ? "active"
      : flightData.status.toLowerCase().includes("ground")
        ? "landed"
        : "unknown"
    : "unknown";

  return (
    <>
      {/* ...existing JSX... */}

      {flightData?.found && (
        <div className="fl-detail-grid">
          {flightData.country && (
            <div className="fl-detail-item">
              <div className="dlbl">Country</div>
              <div className="dval">{flightData.country}</div>
            </div>
          )}
          {flightData.velocity && flightData.velocity !== "—" && (
            <div className="fl-detail-item">
              <div className="dlbl">Speed</div>
              <div className="dval">{flightData.velocity}</div>
            </div>
          )}
          {flightData.lat != null && flightData.lon != null && (
            <div className="fl-detail-item">
              <div className="dlbl">Position</div>
              <div className="dval">
                {flightData.lat.toFixed(1)}° {flightData.lon.toFixed(1)}°
              </div>
            </div>
          )}
          {flightData.squawk && (
            <div className="fl-detail-item">
              <div className="dlbl">Squawk</div>
              <div className="dval">{flightData.squawk}</div>
            </div>
          )}
        </div>
      )}

      {/* ...existing JSX... */}
    </>
  );
}
