'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Sparkles } from '@react-three/drei'
import { easing } from 'maath'
import * as THREE from 'three'

// --- High-Fidelity Spider Configuration ---
const LEG_COUNT = 8
const BODY_RADIUS = 0.5
const ABDOMEN_SIZE = 1.0
const THORAX_SIZE = 0.4
const IDEAL_LEG_DIST = 2.5
const STEP_HEIGHT = 1.0
const STEP_THRESHOLD = 1.4

const spiderColors = {
    body: '#0a0a0c',
    glow: '#ff0066', // Deep pink/red glow
    secondaryGlow: '#7000df', // Purple secondary
    joint: '#ffffff'
}

const legConfigs = Array.from({ length: LEG_COUNT }).map((_, i) => {
    const angle = (i / LEG_COUNT) * Math.PI * 2
    // Stagger legs: 4 on each side looks more natural than a circle for a realistic spider
    // But we'll stick to circle for now and distribute them slightly
    const baseX = Math.cos(angle) * (BODY_RADIUS * 0.8)
    const baseZ = Math.sin(angle) * (BODY_RADIUS * 0.8)
    const idealX = Math.cos(angle) * IDEAL_LEG_DIST
    const idealZ = Math.sin(angle) * IDEAL_LEG_DIST
    return { baseX, baseZ, idealX, idealZ, angle }
})

// --- Component: Spider Body (Abdomen, Thorax, Head) ---
function SpiderBody({ color, glowColor }: { color: string; glowColor: string }) {
    const abdomenRef = useRef<THREE.Group>(null)
    const headRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        const t = state.clock.elapsedTime
        if (abdomenRef.current) {
            // Subtle breathing/pulsing of the abdomen
            abdomenRef.current.position.y = Math.sin(t * 1.5) * 0.05
            // abdomenRef.current.rotation.x = Math.sin(t * 0.5) * 0.05
        }
        if (headRef.current) {
            headRef.current.rotation.y = Math.sin(t * 2) * 0.1
        }
    })

    return (
        <group>
            {/* Thorax (Central connector) */}
            <mesh>
                <sphereGeometry args={[THORAX_SIZE, 16, 16]} />
                <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Abdomen (Large rear bulb) */}
            <group ref={abdomenRef} position={[0, 0, 0.6]}>
                <mesh scale={[1, 0.8, 1.4]}>
                    <sphereGeometry args={[ABDOMEN_SIZE, 32, 32]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Abdomen Grid Pattern Overlay */}
                <mesh scale={[1.01, 0.81, 1.41]}>
                    <sphereGeometry args={[ABDOMEN_SIZE, 16, 16]} />
                    <meshStandardMaterial 
                        color={glowColor} 
                        wireframe 
                        emissive={glowColor} 
                        emissiveIntensity={2} 
                        transparent 
                        opacity={0.3} 
                    />
                </mesh>
                {/* Internal glow */}
                <pointLight intensity={10} distance={4} color={glowColor} />
            </group>

            {/* Head */}
            <group ref={headRef} position={[0, 0, -0.4]}>
                <mesh scale={[0.8, 0.7, 0.8]}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Glowing Eyes */}
                <group position={[0, 0.1, -0.2]}>
                    <mesh position={[-0.1, 0, 0]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color={glowColor} />
                    </mesh>
                    <mesh position={[0.1, 0, 0]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color={glowColor} />
                    </mesh>
                </group>
                {/* Mandibles */}
                <group position={[0, -0.1, -0.3]} rotation={[0.4, 0, 0]}>
                    <mesh position={[-0.1, 0, 0]} rotation={[0, 0, 0.2]}>
                        <cylinderGeometry args={[0.02, 0.005, 0.2]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    <mesh position={[0.1, 0, 0]} rotation={[0, 0, -0.2]}>
                        <cylinderGeometry args={[0.02, 0.005, 0.2]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                </group>
            </group>
        </group>
    )
}

// --- Component: 3-Segment IK Spider Leg ---
function SpiderLeg({ config, bodyRef, color, glowColor }: { 
    config: any; 
    bodyRef: React.RefObject<THREE.Group | null>; 
    color: string;
    glowColor: string;
}) {
    // const footRef = useRef<THREE.Group>(null)
    const upperRef = useRef<THREE.Group>(null) // Femur
    const lowerRef = useRef<THREE.Group>(null) // Tibia
    const coxaRef = useRef<THREE.Group>(null) // Small base joint
    
    const state = useRef({
        currentPos: new THREE.Vector3(config.idealX, 0, config.idealZ),
        targetPos: new THREE.Vector3(config.idealX, 0, config.idealZ),
        isStepping: false,
        stepProgress: 0,
        basePos: new THREE.Vector3(),
        idealPos: new THREE.Vector3(),
    })

    useFrame((_, dt) => {
        if (!bodyRef.current) return
        const s = state.current

        // 1. Calculate Positions
        s.idealPos.set(config.idealX, 0, config.idealZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)
        
        s.basePos.set(config.baseX, 0, config.baseZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)

        // 2. Step Logic
        const distToIdeal = s.currentPos.distanceTo(s.idealPos)
        if (!s.isStepping && distToIdeal > STEP_THRESHOLD) {
            s.isStepping = true
            s.stepProgress = 0
            const velocityDir = new THREE.Vector3().subVectors(s.idealPos, s.currentPos).normalize().multiplyScalar(0.6)
            s.targetPos.copy(s.idealPos).add(velocityDir)
        }

        if (s.isStepping) {
            s.stepProgress += dt * 8
            if (s.stepProgress >= 1) {
                s.stepProgress = 1
                s.isStepping = false
            }
            s.currentPos.lerpVectors(s.currentPos, s.targetPos, s.stepProgress)
            s.currentPos.y = Math.sin(s.stepProgress * Math.PI) * STEP_HEIGHT
        } else {
            s.currentPos.y = 0
        }

        // 3. IK Orientation (TIGHTER KNEE)
        // Position variables for joints
        if (coxaRef.current && upperRef.current && lowerRef.current) {
            // Place coxa at base
            coxaRef.current.position.copy(s.basePos)
            
            // Vector from base to foot
            const toFoot = new THREE.Vector3().subVectors(s.currentPos, s.basePos)
            const dist = toFoot.length()
            
            // Simple IK: Midpoint always raised high (the "knee")
            // We'll calculate a knee point that stays above the line
            const mid = new THREE.Vector3().lerpVectors(s.basePos, s.currentPos, 0.4)
            mid.y += Math.max(1.5, dist * 0.8) // High knees for spider look
            
            // Update upper segment (femur) to look from base to knee
            upperRef.current.position.copy(s.basePos)
            upperRef.current.lookAt(mid)
            
            // Scale and rotate segment mesh
            const femLen = s.basePos.distanceTo(mid)
            const femurMesh = upperRef.current.children[0] as THREE.Mesh
            if (femurMesh) {
                femurMesh.position.z = femLen / 2
                femurMesh.scale.z = femLen
            }

            // Update lower segment (tibia) to look from knee to foot
            lowerRef.current.position.copy(mid)
            lowerRef.current.lookAt(s.currentPos)
            
            const tibLen = mid.distanceTo(s.currentPos)
            const tibiaMesh = lowerRef.current.children[0] as THREE.Mesh
            if (tibiaMesh) {
                tibiaMesh.position.z = tibLen / 2
                tibiaMesh.scale.z = tibLen
            }
        }
    })

    return (
        <group>
            {/* Upper Leg (Femur) */}
            <group ref={upperRef}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.08, 1, 8]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Joint Glow */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color={glowColor} />
                </mesh>
            </group>

            {/* Lower Leg (Tibia) */}
            <group ref={lowerRef}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.05, 1, 8]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
                </mesh>
                {/* Knee Joint Glow */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color={glowColor} />
                    <pointLight intensity={2} distance={1} color={glowColor} />
                </mesh>
            </group>

            {/* Base Connector (Coxa) */}
            <group ref={coxaRef}>
                 <mesh>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </group>
        </group>
    )
}

function Spider() {
    const bodyRef = useRef<THREE.Group>(null)
    const { pointer, camera } = useThree()
    const targetPos = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())

    useFrame((state, dt) => {
        raycaster.current.setFromCamera(pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, targetPos.current)
        
        targetPos.current.y = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.1

        if (bodyRef.current) {
            easing.damp3(bodyRef.current.position, targetPos.current, 0.25, dt)
            const dir = new THREE.Vector3().subVectors(targetPos.current, bodyRef.current.position)
            dir.y = 0
            if (dir.lengthSq() > 0.01) {
                const targetRotation = Math.atan2(dir.x, dir.z)
                const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation)
                easing.dampQ(bodyRef.current.quaternion, targetQuat, 0.2, dt)
            }
            // Add a little body tilt
            bodyRef.current.rotation.x = -dir.length() * 0.1
        }
    })

    return (
        <group>
            <group ref={bodyRef}>
                <SpiderBody color={spiderColors.body} glowColor={spiderColors.glow} />
            </group>

            {legConfigs.map((config, i) => (
                <SpiderLeg 
                    key={i} 
                    config={config} 
                    bodyRef={bodyRef} 
                    color={spiderColors.body} 
                    glowColor={spiderColors.glow} 
                />
            ))}
        </group>
    )
}

function Leash() {
    const { pointer, camera } = useThree()
    const targetPos = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        raycaster.current.setFromCamera(pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, targetPos.current)
        if (meshRef.current) {
            meshRef.current.position.set(targetPos.current.x, 0.1, targetPos.current.z)
        }
    })

    return (
        <mesh ref={meshRef} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.4, 0.5, 32]} />
            <meshBasicMaterial color={spiderColors.glow} transparent opacity={0.2} />
        </mesh>
    )
}

export function SpiderScene() {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {mounted && (
                <Canvas shadows={false} dpr={[1, 2]} eventSource={document.documentElement} eventPrefix="client">
                <PerspectiveCamera makeDefault position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} fov={35} />
                
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <gridHelper args={[50, 50, '#ffffff', '#ffffff']} position={[0, -0.01, 0]} material-opacity={0.03} material-transparent />
                
                <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                <Spider />
                <Leash />

                <Sparkles count={50} scale={20} size={2} speed={0.4} color={spiderColors.glow} opacity={0.1} />
                <Environment preset="night" />
            </Canvas>
            )}
        </div>
    )
}
