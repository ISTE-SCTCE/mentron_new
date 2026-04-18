'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'

const ThreeLine = 'line' as any

// Spider Configuration
const LEG_COUNT = 8
const STEP_HEIGHT = 1.0
const BODY_RADIUS = 0.8
const IDEAL_LEG_DIST = 3.0
const STEP_THRESHOLD = 1.8

// Define realistic spider leg configurations
// A real spider has legs originating from the cephalothorax (front segment).
const legConfigs = [
    // Front right
    { baseX: 0.4, baseZ: 0.6, idealX: 2.5, idealZ: 3.0, gaitGroup: 0 },
    // Front left
    { baseX: -0.4, baseZ: 0.6, idealX: -2.5, idealZ: 3.0, gaitGroup: 1 },
    
    // Middle-front right
    { baseX: 0.5, baseZ: 0.3, idealX: 3.5, idealZ: 1.0, gaitGroup: 1 },
    // Middle-front left
    { baseX: -0.5, baseZ: 0.3, idealX: -3.5, idealZ: 1.0, gaitGroup: 0 },
    
    // Middle-back right
    { baseX: 0.5, baseZ: 0.0, idealX: 3.0, idealZ: -1.5, gaitGroup: 0 },
    // Middle-back left
    { baseX: -0.5, baseZ: 0.0, idealX: -3.0, idealZ: -1.5, gaitGroup: 1 },
    
    // Back right
    { baseX: 0.3, baseZ: -0.3, idealX: 2.0, idealZ: -3.5, gaitGroup: 1 },
    // Back left
    { baseX: -0.3, baseZ: -0.3, idealX: -2.0, idealZ: -3.5, gaitGroup: 0 },
]

// --- Inverse Kinematics Realistic Leg Component ---
function SpiderLeg({ config, bodyRef, color }: { config: any; bodyRef: any, color: string }) {
    const femurRef = useRef<THREE.Mesh>(null)
    const tibiaRef = useRef<THREE.Mesh>(null)
    const footRef = useRef<THREE.Mesh>(null)

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
        
        // Calculate ideal position in world space
        s.idealPos.set(config.idealX, 0, config.idealZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)
        
        // Calculate base position in world space
        s.basePos.set(config.baseX, 0.4, config.baseZ) // Base slightly elevated (cephalothorax height)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)

        // Step logic
        const distToIdeal = s.currentPos.distanceTo(s.idealPos)
        if (!s.isStepping && distToIdeal > STEP_THRESHOLD) {
            s.isStepping = true
            s.stepProgress = 0
            const velocityDir = new THREE.Vector3().subVectors(s.idealPos, s.currentPos).normalize().multiplyScalar(0.8)
            s.targetPos.copy(s.idealPos).add(velocityDir)
        }

        if (s.isStepping) {
            s.stepProgress += dt * 10 // step speed
            if (s.stepProgress >= 1) {
                s.stepProgress = 1
                s.isStepping = false
            }
            s.currentPos.lerpVectors(s.currentPos, s.targetPos, s.stepProgress)
            const arc = Math.sin(s.stepProgress * Math.PI) * STEP_HEIGHT
            s.currentPos.y = Math.max(0, arc)
        } else {
             s.currentPos.y = 0
        }

        // Calculate Knees for rigid segments
        const midPoint = s.basePos.clone().lerp(s.currentPos, 0.4)
        const dist = s.basePos.distanceTo(s.currentPos)
        midPoint.y = Math.max(s.basePos.y, s.currentPos.y) + (IDEAL_LEG_DIST - dist * 0.4)

        // Orient Femur (base to knee)
        if (femurRef.current) {
            const fDir = midPoint.clone().sub(s.basePos)
            const fLen = fDir.length()
            femurRef.current.position.copy(s.basePos).add(fDir.clone().multiplyScalar(0.5))
            if (fLen > 0.001) femurRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fDir.normalize())
            femurRef.current.scale.set(1, fLen, 1)
        }

        // Orient Tibia (knee to foot)
        if (tibiaRef.current) {
            const tDir = s.currentPos.clone().sub(midPoint)
            const tLen = tDir.length()
            tibiaRef.current.position.copy(midPoint).add(tDir.clone().multiplyScalar(0.5))
            if (tLen > 0.001) tibiaRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tDir.normalize())
            tibiaRef.current.scale.set(0.6, tLen, 0.6)
        }

        if (footRef.current) {
            footRef.current.position.copy(s.currentPos)
        }
    })

    return (
        <group>
            {/* Femur */}
            <mesh ref={femurRef}>
                <cylinderGeometry args={[0.08, 0.06, 1, 8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Tibia */}
            <mesh ref={tibiaRef}>
                <cylinderGeometry args={[0.06, 0.02, 1, 8]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {/* Foot */}
            <mesh ref={footRef}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color={color} roughness={1.0} />
            </mesh>
        </group>
    )
}

function Spider({ isDragging, bodyRef }: { isDragging: boolean, bodyRef: any }) {
    const { pointer, camera } = useThree()
    const groundTarget = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())

    useFrame((state, dt) => {
        if (!bodyRef.current) return

        if (isDragging) {
            // Find intersection of mouse with ground plane
            raycaster.current.setFromCamera(pointer, camera)
            raycaster.current.ray.intersectPlane(plane.current, groundTarget.current)
        } else {
            // Stop moving by setting target to current ground pos of the body
            groundTarget.current.x = bodyRef.current.position.x
            groundTarget.current.z = bodyRef.current.position.z
        }
        
        // Add some hovering bob to the target body height
        const targetY = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.2

        // Smoothly move body towards mouse
        const moveTarget = new THREE.Vector3(groundTarget.current.x, targetY, groundTarget.current.z)
        easing.damp3(bodyRef.current.position, moveTarget, 0.2, dt)
        
        // Rotate body to face movement direction (if moving fast enough)
        const dir = new THREE.Vector3(groundTarget.current.x - bodyRef.current.position.x, 0, groundTarget.current.z - bodyRef.current.position.z)
        if (dir.lengthSq() > 0.01) {
            const targetRotation = Math.atan2(dir.x, dir.z)
            // easing.dampAngle doesn't natively exist simply in maath string format, we can do quaternion spherical lerp
            const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation)
            easing.dampQ(bodyRef.current.quaternion, targetQuat, 0.2, dt)
        }
    })

    const bodyColor = "#111111" // Dark grey/black real body
    const legColor = "#1a1a1a" // Slightly lighter black for legs

    return (
        <group>
            {/* Realistic Spider Body Chassis */}
            <group ref={bodyRef}>
                {/* Abdomen (Back) */}
                <mesh position={[0, 0.5, -1.0]} scale={[1.0, 0.8, 1.2]}>
                    <sphereGeometry args={[1.0, 32, 32]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.9} />
                </mesh>
                {/* Cephalothorax (Front) */}
                <mesh position={[0, 0.3, 0.6]} scale={[1.0, 0.6, 1.0]}>
                    <sphereGeometry args={[0.7, 32, 32]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} />
                </mesh>
                
                {/* Fangs */}
                <mesh position={[-0.2, 0.2, 1.2]} rotation={[Math.PI/2, 0, -Math.PI/8]}>
                    <coneGeometry args={[0.08, 0.4, 8]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.8} />
                </mesh>
                <mesh position={[0.2, 0.2, 1.2]} rotation={[Math.PI/2, 0, Math.PI/8]}>
                    <coneGeometry args={[0.08, 0.4, 8]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.8} />
                </mesh>
            </group>

            {/* 8 Legs */}
            {legConfigs.map((config, i) => (
                <SpiderLeg key={i} config={config} bodyRef={bodyRef} color={legColor} />
            ))}
        </group>
    )
}

function Leash({ isDragging, bodyRef }: { isDragging: boolean, bodyRef: any }) {
    const { pointer, camera } = useThree()
    const pointerPos = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())
    const meshRef = useRef<THREE.Mesh>(null)
    const lineRef = useRef<THREE.Line>(null)
    const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), [])

    useFrame(() => {
        if (!isDragging) {
            if (meshRef.current) meshRef.current.visible = false
            if (lineRef.current) lineRef.current.visible = false
            return
        }

        raycaster.current.setFromCamera(pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, pointerPos.current)
        
        if (meshRef.current) {
            meshRef.current.visible = true
            meshRef.current.position.set(pointerPos.current.x, 0.1, pointerPos.current.z)
        }

        if (lineRef.current && bodyRef.current) {
            lineRef.current.visible = true
            const posArray = lineRef.current.geometry.attributes.position.array as Float32Array;
            posArray[0] = pointerPos.current.x
            posArray[1] = 0.1
            posArray[2] = pointerPos.current.z
            
            // start leash at spider body
            posArray[3] = bodyRef.current.position.x
            posArray[4] = bodyRef.current.position.y + 0.5
            posArray[5] = bodyRef.current.position.z
            lineRef.current.geometry.attributes.position.needsUpdate = true
        }
    })



    return (
        <group>
            <mesh ref={meshRef} rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
            </mesh>
            <ThreeLine ref={lineRef} geometry={geom}>
                <lineBasicMaterial color="#00ffff" linewidth={2} transparent opacity={0.3}/>
            </ThreeLine>
        </group>
    )
}

export function SpiderScene() {
    const [mounted, setMounted] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const bodyRef = useRef<any>(null)

    useEffect(() => {
        setMounted(true)
        const handleDown = () => setIsDragging(true)
        const handleUp = () => setIsDragging(false)
        window.addEventListener('pointerdown', handleDown)
        window.addEventListener('pointerup', handleUp)
        window.addEventListener('pointerleave', handleUp)
        window.addEventListener('pointercancel', handleUp)
        
        return () => {
            window.removeEventListener('pointerdown', handleDown)
            window.removeEventListener('pointerup', handleUp)
            window.removeEventListener('pointerleave', handleUp)
            window.removeEventListener('pointercancel', handleUp)
        }
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <Canvas shadows={false} dpr={[1, 2]} eventSource={typeof document !== 'undefined' ? document.documentElement : undefined} eventPrefix="client">
                <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={35} />
                {/* Remove background color to allow transparency */}
                
                <ambientLight intensity={0.5} />
                
                {/* Subtle tech grid floor */}
                <gridHelper args={[50, 50, '#ffffff', '#ffffff']} position={[0, -0.01, 0]} material-opacity={0.05} material-transparent />
                
                {/* Ground plane for raycasting (invisible) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                <Spider isDragging={isDragging} bodyRef={bodyRef} />
                <Leash isDragging={isDragging} bodyRef={bodyRef} />

                {/* Floating ambient particles for sci-fi feel */}
                <Sparkles count={100} scale={20} size={2} speed={0.4} color="#00ffff" opacity={0.2} />

                {/* Environment for shiny reflections if we use PBR */}
                <Environment preset="city" />
            </Canvas>
        </div>
    )
}
