import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  useGLTF,
  useHelper,
  useProgress,
  Preload,
} from "@react-three/drei";
import { Suspense, useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { Perf } from "r3f-perf";
import Switch from "./Switch";

function Model({ file }) {
  const { scene } = useGLTF(file);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <primitive
      object={scene}
      onPointerOver={() => (document.body.style.cursor = "grab")}
      onPointerOut={() => (document.body.style.cursor = "default")}
      onPointerDown={() => (document.body.style.cursor = "grabbing")}
      onPointerUp={() => (document.body.style.cursor = "grab")}
    />
  );
}
useGLTF.preload("/apartment.glb");

function Sun({ position, intensity, shadowCamera, targetPosition }) {
  const light = useRef();
  const target = useRef();
  const { scene } = useThree();
  // useHelper(light, THREE.DirectionalLightHelper, 1);
  // Shows the shadow camera box
  // useEffect(() => {
  //   if (!light.current) return;

  //   const helper = new THREE.CameraHelper(light.current.shadow.camera);
  //   scene.add(helper);

  //   return () => scene.remove(helper);
  // }, [scene]);
  useEffect(() => {
    if (!light.current || !target.current) return;

    light.current.target = target.current;
    light.current.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <directionalLight
        ref={light}
        position={position}
        intensity={intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-top={shadowCamera[0]}
        shadow-camera-bottom={shadowCamera[1]}
        shadow-camera-left={shadowCamera[2]}
        shadow-camera-right={shadowCamera[3]}
      />
      {/* sun target */}
      <object3D ref={target} position={targetPosition} />
      {/* <mesh position={targetPosition}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color="red" />
      </mesh> */}
    </>
  );
}

function PointLamp({ position, intensity, color, castShadow }) {
  const light = useRef();

  // useHelper(light, THREE.PointLightHelper, 0.3);

  return (
    <pointLight
      ref={light}
      position={position}
      intensity={intensity}
      color={color}
      shadow-bias={-0.01}
      castShadow={castShadow}
    />
  );
}

function SpotLamp({
  position,
  targetPosition,
  intensity,
  color,
  angle,
  penumbra,
  shadowMapW,
  shadowMapH,
  castShadow,
}) {
  const light = useRef();
  const target = useRef();

  useEffect(() => {
    if (!light.current || !target.current) return;

    light.current.target = target.current;
    light.current.target.updateMatrixWorld();
  }, []);

  // Uncomment while positioning
  // useHelper(light, THREE.SpotLightHelper);

  return (
    <>
      <spotLight
        ref={light}
        position={position}
        intensity={intensity}
        color={color}
        angle={angle}
        penumbra={penumbra}
        castShadow={castShadow}
        shadow-mapSize-width={shadowMapW}
        shadow-mapSize-height={shadowMapH}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />

      <object3D ref={target} position={targetPosition} />

      {/* Uncomment while positioning */}
      {/* <mesh position={targetPosition}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="red" />
      </mesh> */}
    </>
  );
}

function SceneReady({ onReady, setIsDay }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    gl.compile(scene, camera);

    let frames = 0;

    const check = () => {
      frames++;

      if (frames === 60) {
        // switch to night briefly to compile night lighting
        setIsDay(false);
      }

      if (frames > 120) {
        // return to day after night compiled
        setIsDay(true);
        onReady();
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  }, []);

  return null;
}

export default function App() {
  const [isDay, setIsDay] = useState(true);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [hideGif, setHideGif] = useState(false);
  const model = "/apartment.glb";

  return (
    <div className={`app ${isDay ? "day" : "night"}`}>
      {!started && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            zIndex: 100,
          }}
        >
          {!hideGif && (
            <img
              src="/cat.gif"
              alt="Loading apartment"
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: "100vh",
                width: "auto",
                objectFit: "contain",
                transition: "opacity 1.5s ease-in-out",
                opacity: ready ? 0 : 1,
              }}
              onTransitionEnd={() => {
                if (ready) setHideGif(true);
              }}
            />
          )}

          <button
            onClick={() => {
              setStarted(true);
            }}
            className={`view-button ${hideGif ? "visible" : ""}`}
          >
            View apartment
          </button>
        </div>
      )}

      <div className="viewer">
        {started && (
          <div className="toggle-position">
            <Switch isDay={isDay} setIsDay={setIsDay} />
          </div>
        )}

        <Canvas shadows camera={{ position: [6, 4, 6] }} gl={{ alpha: true }}>
          <Perf position="top-left" />
          {/* DAY TIME */}
          {/* {isDay && ( */}
          <group visible={isDay}>
            {/* spavaca prozor i trpezarija */}
            <Sun
              position={[-17, 7, 0]}
              intensity={5}
              shadowCamera={[5, -2, -12, 2]}
              targetPosition={[-3, 1, 4]}
            />
            {/* dnevna soba */}
            <Sun
              position={[-2, 7, -15]}
              intensity={5}
              shadowCamera={[10, -2, -5, 5]}
              targetPosition={[0, 0, -6]}
            />
            {/* balkon */}
            <Sun
              position={[20, 12, 7]}
              intensity={5}
              shadowCamera={[10, -1, -5, 8]}
              targetPosition={[7, 0, 3]}
            />
            <Environment
              preset="city"
              background={false}
              environmentIntensity={0.1}
            />
          </group>
          {/* )} */}
          {/* NIGHT TIME */}
          {/* {!isDay && ( */}
          <group visible={!isDay}>
            <Environment
              preset="night"
              background={false}
              environmentIntensity={0.2}
            />

            {/* Living Room */}
            <PointLamp
              position={[-2, 1, -4.95]}
              intensity={4}
              color={"#f8cc7c"}
              castShadow={false}
            />
            <PointLamp
              position={[0.6, 0.8, -4.7]}
              intensity={2}
              color={"#f8cc7c"}
              castShadow={false}
            />

            {/* Bedroom */}
            <PointLamp
              position={[5.1, 1, 5.2]}
              intensity={1}
              color={"#fae4bb"}
              castShadow={false}
            />

            {/* Bathroom */}
            <PointLamp
              position={[1, 2.3, 2.3]}
              intensity={2}
              color={"#fae4bb"}
              castShadow={true}
            />

            {/* Bathroom */}
            {/* <SpotLamp
                position={[1, 2.4, 2.3]}
                targetPosition={[1, 0, 2.3]}
                intensity={4}
                color="#fae4bb"
                angle={Math.PI / 5}
                penumbra={1}
                shadowMapW={1024}
                shadowMapH={1024}
                castShadow={true}
              /> */}
            {/* Bedroom */}
            <SpotLamp
              position={[0, 1.3, 3.2]}
              targetPosition={[0, 0, 3.2]}
              intensity={4}
              color="#fae4bb"
              angle={Math.PI / 4}
              penumbra={1}
              shadowMapW={1024}
              shadowMapH={1024}
              castShadow={false}
            />

            {/* Dining and kitchen */}
            <SpotLamp
              position={[-1, 3, -0.7]}
              targetPosition={[-1, 0, -0.7]}
              intensity={15}
              color="#f8cc7c"
              angle={Math.PI / 4}
              penumbra={1}
              shadowMapW={1024}
              shadowMapH={1024}
              castShadow={true}
            />

            {/* Hallway  */}
            <SpotLamp
              position={[2.75, 1.8, 1]}
              targetPosition={[2.75, 4, 1]}
              intensity={15}
              color="#f8cc7c"
              angle={Math.PI / 4}
              penumbra={1}
              shadowMapW={1024}
              shadowMapH={1024}
              castShadow={false}
            />
            <SpotLamp
              position={[3.5, 2.4, 1]}
              targetPosition={[3, 0, 1]}
              intensity={5}
              color="#f8cc7c"
              angle={Math.PI / 4}
              penumbra={1}
              shadowMapW={1024}
              shadowMapH={1024}
              castShadow={false}
            />
          </group>
          {/* )} */}
          <ambientLight intensity={0.4} />

          <Suspense fallback={null}>
            <Model file={model} />
          </Suspense>

          {!ready && (
            <SceneReady onReady={() => setReady(true)} setIsDay={setIsDay} />
          )}

          <Preload all />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
