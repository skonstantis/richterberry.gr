import { useEffect } from "react";
import styles from "./howItWorks.module.css";

function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works - RichterBerry";
  }, []);
  return (
    <div className={styles.container}>
      <h1>How It Works</h1>
      <p>
        The purpose of <strong>RichterBerry</strong> is to deliver real-time,
        near-zero-latency seismic data straight to your browser from all across
        Greece. To achieve this, we deploy custom-built seismic stations
        integrated nationwide, designed to operate 24/7 and continuously listen
        for underground vibrations.
      </p>

      <p>
        RichterBerry runs on a carefully designed pipeline with three key
        stages. Each stage plays a critical role in delivering accurate,
        real-time seismic data to your browser with minimal delay. To ensure
        reliability, we constantly monitor the health status of every part of
        the pipeline: the station, the server, and the client. Here’s how it
        works:
      </p>

      <h2>1. The Station</h2>
      <p>
        The station is the first — and by far the most complex — stage of the
        pipeline. It’s the physical seismic node deployed in the field, designed
        to operate fully autonomously. The station continuously detects ground
        vibrations using a high-sensitivity geophone, capable of capturing even
        the tiniest movements underground. These analog signals are digitized by
        an analog-to-digital converter (ADC), transforming them into precise
        digital data.
      </p>

      <p>
        To ensure every recorded vibration has an exact timestamp, the system
        uses a GPS module and antenna for accurate time synchronization via
        satellite. At the core of the station is a Raspberry Pi running all the
        custom software for data acquisition, local filtering, and real-time
        transmission to the backend server. The geophone collects data at 250 Hz
        — that’s 250 high-quality samples every second — providing detailed
        waveforms suitable for detecting even subtle tremors.
      </p>

      <p>
        The station’s health status continuously monitors its hardware, sensors,
        GPS lock, and software processes to keep the system operational and
        reliable in the field, 24/7. The station can transmit both
        GPS-synchronized data and non-synchronized data. Data without GPS sync
        can still be used for live visualization, but their exact timestamps may
        not be precise enough for scientific calculations. In contrast,
        GPS-synchronized data can be used for more advanced tasks, such as
        locating an earthquake’s epicenter or comparing signals from stations of
        other networks across the world.
      </p>

      <p>
        Station placement is critical: to accurately detect seismic activity,
        the station must be installed in a quiet location away from human-made
        noise sources like traffic, machinery, or foot traffic. This helps
        ensure that the data collected reflects true ground vibrations rather
        than ambient noise, improving the quality and reliability of the seismic
        measurements.
      </p>

      <h2>2. The Server</h2>
      <p>
        The server is the central hub of the RichterBerry pipeline. It receives
        the continuous stream of seismic data sent in real time from all
        deployed stations across the country. Hosted in a secure data center and
        protected behind a reverse proxy, it runs specialized services that
        handle multiple critical tasks simultaneously.
      </p>

      <p>
        First, it filters out noise and unwanted signals to improve data
        quality. Then, it processes the incoming waveforms, applying algorithms
        that prepare the data for visualization and further analysis. The server
        also manages data routing, sending the processed seismic information to
        connected clients with minimal latency.
      </p>

      <p>
        The server’s health status is constantly monitored to ensure that
        processing services, network connections, and storage systems are
        running smoothly. Any disruptions here can delay or interrupt the flow
        of data to users, so maintaining server uptime and performance is
        crucial for delivering accurate and timely seismic information.
      </p>

      <h2>3. The Client</h2>
      <p>
        The client is the final stage of the RichterBerry pipeline — the
        interface you interact with in your web browser. It connects to the
        backend server via a live connection, receiving processed seismic data
        from the station of your choice in real time.
      </p>

      <p>
        Designed for speed and clarity, the client renders live waveform plots
        and spectrograms that update continuously with near-zero latency. It
        displays a visual of the last 30 seconds of seismic activity only,
        giving users an immediate snapshot of current ground vibrations. 
        Users have access data streams of 30 seconds at 250hz and 5 minutes 
        at 50hz. The client also shows the health status of the entire pipeline 
        for the selected station, allowing users to monitor seismic activity as 
        it happens with smooth, responsive visuals.
      </p>

      <p>
        The client’s health status continuously monitors its connection to the
        server, ensuring data flows uninterrupted. It also checks that all
        visualization components are functioning correctly, so you always
        receive accurate, up-to-date information without lag or glitches.
      </p>
    </div>
  );
}

export default HowItWorks;