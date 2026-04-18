'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'

const ThreeLine = 'line' as any

// Spider Configuration
const LEG_COUNT = 8
const STEP_HEIGHT = 1.0
const BODY_RADIUS = 1.2
const IDEAL_LEG_DIST = 4.5
const STEP_THRESHOLD = 2.5

// Define realistic spider leg configurations
// A real spider has legs originating from the cephalothorax (front segment).
const legConfigs = [
    // Front right
    { baseX: 0.6, baseZ: 0.9, idealX: 3.5, idealZ: 4.5, gaitGroup: 0 },
    // Front left
    { baseX: -0.6, baseZ: 0.9, idealX: -3.5, idealZ: 4.5, gaitGroup: 1 },
    
    // Middle-front right
    { baseX: 0.7, baseZ: 0.4, idealX: 5.0, idealZ: 1.5, gaitGroup: 1 },
    // Middle-front left
    { baseX: -0.7, baseZ: 0.4, idealX: -5.0, idealZ: 1.5, gaitGroup: 0 },
    
    // Middle-back right
    { baseX: 0.7, baseZ: 0.0, idealX: 4.5, idealZ: -2.0, gaitGroup: 0 },
    // Middle-back left
    { baseX: -0.7, baseZ: 0.0, idealX: -4.5, idealZ: -2.0, gaitGroup: 1 },
    
    // Back right
    { baseX: 0.4, baseZ: -0.4, idealX: 3.0, idealZ: -4.5, gaitGroup: 1 },
    // Back left
    { baseX: -0.4, baseZ: -0.4, idealX: -3.0, idealZ: -4.5, gaitGroup: 0 },
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
        
        s.idealPos.set(config.idealX, 0, config.idealZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)
        
        s.basePos.set(config.baseX, 0.4, config.baseZ) 
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)

        const distToIdeal = s.currentPos.distanceTo(s.idealPos)
        if (!s.isStepping && distToIdeal > STEP_THRESHOLD) {
            s.isStepping = true
            s.stepProgress = 0
            const velocityDir = new THREE.Vector3().subVectors(s.idealPos, s.currentPos).normalize().multiplyScalar(0.8)
            s.targetPos.copy(s.idealPos).add(velocityDir)
        }

        if (s.isStepping) {
            s.stepProgress += dt * 10
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

        const midPoint = s.basePos.clone().lerp(s.currentPos, 0.4)
        const dist = s.basePos.distanceTo(s.currentPos)
        midPoint.y = Math.max(s.basePos.y, s.currentPos.y) + (IDEAL_LEG_DIST - dist * 0.4)

        if (femurRef.current) {
            const fDir = midPoint.clone().sub(s.basePos)
            const fLen = fDir.length()
            femurRef.current.position.copy(s.basePos).add(fDir.clone().multiplyScalar(0.5))
            if (fLen > 0.001) femurRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fDir.normalize())
            femurRef.current.scale.set(1.2, fLen, 1.2)
        }

        if (tibiaRef.current) {
            const tDir = s.currentPos.clone().sub(midPoint)
            const tLen = tDir.length()
            tibiaRef.current.position.copy(midPoint).add(tDir.clone().multiplyScalar(0.5))
            if (tLen > 0.001) tibiaRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tDir.normalize())
            tibiaRef.current.scale.set(0.8, tLen, 0.8)
        }

        if (footRef.current) {
            footRef.current.position.copy(s.currentPos)
        }
    })

    return (
        <group>
            <mesh ref={femurRef}>
                <cylinderGeometry args={[0.2, 0.18, 1, 16]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh ref={tibiaRef}>
                <cylinderGeometry args={[0.18, 0.1, 1, 16]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh ref={footRef}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color="#ff8c00" emissive="#ff8c00" emissiveIntensity={0.5} />
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
            raycaster.current.setFromCamera(pointer, camera)
            raycaster.current.ray.intersectPlane(plane.current, groundTarget.current)
        } else {
            groundTarget.current.x = bodyRef.current.position.x
            groundTarget.current.z = bodyRef.current.position.z
        }
        
        const targetY = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1

        const moveTarget = new THREE.Vector3(groundTarget.current.x, targetY, groundTarget.current.z)
        easing.damp3(bodyRef.current.position, moveTarget, 0.2, dt)
        
        const dir = new THREE.Vector3(groundTarget.current.x - bodyRef.current.position.x, 0, groundTarget.current.z - bodyRef.current.position.z)
        if (dir.lengthSq() > 0.01) {
            const targetRotation = Math.atan2(dir.x, dir.z)
            const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation)
            easing.dampQ(bodyRef.current.quaternion, targetQuat, 0.2, dt)
        }
    })

    const bodyColor = "#2563eb" // Blue
    const centerColor = "#ff8c00" // Glowing Orange

    return (
        <group scale={[0.6, 0.6, 0.6]}>
            <group ref={bodyRef}>
                {/* Robotic Hub Body */}
                <mesh position={[0, 0.4, 0]} scale={[1.2, 0.8, 1.2]}>
                    <sphereGeometry args={[1.2, 32, 32]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
                </mesh>
                
                {/* Glowing Core */}
                <mesh position={[0, 0.4, 0.8]}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color={centerColor} emissive={centerColor} emissiveIntensity={2} />
                </mesh>

                {/* Top decorative cap */}
                <mesh position={[0, 1.2, 0]} scale={[0.8, 0.2, 0.8]}>
                    <cylinderGeometry args={[1, 1, 1, 32]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.8} />
                </mesh>
            </group>

            {legConfigs.map((config, i) => (
                <SpiderLeg key={i} config={config} bodyRef={bodyRef} color={bodyColor} />
            ))}
        </group>
    )
}

function Leash({ isDragging, bodyRef }: { isDragging: boolean, bodyRef: any }) {
    const { pointer, camera } = useThree()
    const pointerPos = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())
    const dotRef = useRef<THREE.Mesh>(null)
    const points = useMemo(() => {
        const p = []
        for (let i = 0; i < 20; i++) p.push(new THREE.Vector3())
        return p
    }, [])

    useFrame(() => {
        if (!isDragging || !bodyRef.current) {
            if (dotRef.current) dotRef.current.visible = false
            return
        }

        raycaster.current.setFromCamera(pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, pointerPos.current)
        
        if (dotRef.current) {
            dotRef.current.visible = true
            dotRef.current.position.set(pointerPos.current.x, 0.1, pointerPos.current.z)
        }
    })

    return (
        <group>
            {/* Target Dot */}
            <mesh ref={dotRef} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[0.3, 32]} />
                <meshBasicMaterial color="#ff8c00" transparent opacity={0.8} />
            </mesh>

            {/* Dotted Line segments */}
            {points.map((_, i) => (
                <LeashSegment key={i} index={i} total={points.length} bodyRef={bodyRef} pointerPos={pointerPos} isDragging={isDragging} />
            ))}
        </group>
    )
}

function LeashSegment({ index, total, bodyRef, pointerPos, isDragging }: any) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (!isDragging || !bodyRef.current || !meshRef.current) {
            if (meshRef.current) meshRef.current.visible = false
            return
        }

        meshRef.current.visible = true
        const lerpFactor = index / total
        meshRef.current.position.lerpVectors(bodyRef.current.position, pointerPos.current, lerpFactor)
        meshRef.current.position.y = bodyRef.current.position.y * (1 - lerpFactor) + 0.1 * lerpFactor
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ff8c00" transparent opacity={0.6} />
        </mesh>
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
                {/* 2D Orthographic Camera looking straight down */}
                <OrthographicCamera makeDefault position={[0, 50, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={40} />
                
                <ambientLight intensity={1.5} />
                
                {/* Ground plane for raycasting (invisible), scaled massively for full screen tracking */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <planeGeometry args={[1000, 1000]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                <Spider isDragging={isDragging} bodyRef={bodyRef} />
                <Leash isDragging={isDragging} bodyRef={bodyRef} />
            </Canvas>
        </div>
    )
}
