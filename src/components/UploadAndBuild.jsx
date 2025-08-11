// src/components/UploadAndBuild.jsx
import { useState, useRef } from "react";
import styled from "@emotion/styled";
import Story from './Story.jsx';
import { normalizeChatGPTExport } from "../data/chatgpt/parse";
import { computeSummerMetrics } from "../metrics/summer";
import { buildSummerSlides } from "../slides/summerWrapped";
import { storyConfig as baseConfig } from "../config/storyConfig";

const Wrapper = styled.div`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #d44f8c, #FFF0F3);
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 40px rgba(212,79,140,0.2);
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 3vw, 2rem);
  color: #E6356F;
`;

const Sub = styled.p`
  margin: 0 0 16px;
  color: #444;
`;

const Drop = styled.button`
  display: block;
  width: 100%;
  margin: 16px 0;
  padding: 24px;
  border: 2px dashed rgba(212,79,140,0.4);
  border-radius: 12px;
  cursor: pointer;
  color: #333;
  background: transparent;
  transition: 0.2s ease;
  &:hover { border-color: rgba(212,79,140,0.8); }
`;

const Small = styled.p`
  font-size: 0.9rem;
  color: #666;
`;

export default function UploadAndBuild() {
  const [config, setConfig] = useState(null);
  const fileRef = useRef(null);
  const [error, setError] = useState("");

  const onFile = async (file) => {
  setError("");
  try {
    const text = await file.text();

    // quick sanity checks
    const head = text.slice(0, 200);
    if (head.startsWith("PK")) {
      throw new Error("Looks like a ZIP. Unzip your export first, then select conversations.json.");
    }
    if (/^\s*<!doctype html>|^\s*<html/i.test(head)) {
      throw new Error("This looks like HTML, not JSON. Pick conversations.json from the unzipped export.");
    }

    const clean = text.replace(/^\uFEFF/, "");
    let json;
    try { json = JSON.parse(clean); }
    catch (e) { throw new Error(`JSON.parse failed: ${e.message}`); }

    let threadsObj;
    try { threadsObj = normalizeChatGPTExport(json); }
    catch (e) { throw new Error(`normalizeChatGPTExport failed: ${e.message}`); }

    const { threads } = threadsObj || {};
    if (!threads || threads.length === 0) {
      throw new Error("No conversations found. Use ChatGPT → Settings → Data Controls → Export → unzip → conversations.json");
    }

    let metrics;
    try { metrics = computeSummerMetrics(threads); }
    catch (e) { throw new Error(`computeSummerMetrics failed: ${e.message}`); }

    let slides;
    try { slides = buildSummerSlides(metrics); }
    catch (e) { throw new Error(`buildSummerSlides failed: ${e.message}`); }

    const finalConfig = {
      startDate: metrics.startISO,
      endDate: metrics.endISO,
      slides,
      theme: baseConfig.theme,
    };
    setConfig(finalConfig);
  } catch (e) {
    console.error(e);
    setError(String(e.message || e));
  }
};

  if (config) return <Story config={config} />;

  return (
    <Wrapper>
      <Card>
        <Title>GPT Summer Wrapped</Title>
        <Sub>Upload your ChatGPT export JSON. All parsing runs in your browser.</Sub>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Drop onClick={() => fileRef.current?.click()}>
          <strong>Click to choose a JSON file</strong><br/>
          (e.g., <code>conversations.json</code> from ChatGPT export)
        </Drop>

        <Small>Settings → Data Controls → Export data → Download → unzip → pick the JSON.</Small>
        {error && <Small style={{ color: "#c00" }}>{error}</Small>}
      </Card>
    </Wrapper>
  );
}