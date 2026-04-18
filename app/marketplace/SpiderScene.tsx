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

// Define leg attachment points and ideal resting positions (circular distribution)
const legConfigs = Array.from({ length: LEG_COUNT }).map((_, i) => {
    const angle = (i / LEG_COUNT) * Math.PI * 2
    // Base attaches to the edge of the body radius
    const baseX = Math.cos(angle) * BODY_RADIUS
    const baseZ = Math.sin(angle) * BODY_RADIUS
    // Ideal foot is further out
    const idealX = Math.cos(angle) * IDEAL_LEG_DIST
    const idealZ = Math.sin(angle) * IDEAL_LEG_DIST

    // We pair legs into two gait groups (Evens vs Odds) so they don't all step at once
    const gaitGroup = i % 2

    return { baseX, baseZ, idealX, idealZ, gaitGroup, angle }
})

// --- Inverse Kinematics Leg Component ---
function SpiderLeg({ config, bodyRef, color }: { config: any; bodyRef: React.RefObject<THREE.Group | null>, color: string }) {
    const footRef = useRef<THREE.Mesh>(null)
    const lineRef = useRef<THREE.Line>(null)
    
    // State of the leg
    const state = useRef({
        currentPos: new THREE.Vector3(config.idealX, 0, config.idealZ),
        targetPos: new THREE.Vector3(config.idealX, 0, config.idealZ),
        isStepping: false,
        stepProgress: 0,
        basePos: new THREE.Vector3(),
        idealPos: new THREE.Vector3(),
        p1: new THREE.Vector3(),
        p2: new THREE.Vector3()
    })

    const geom = useMemo(() => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(30 * 3), 3))
        return g
    }, [])

    useFrame((_, dt) => {
        if (!bodyRef.current) return

        const s = state.current
        
        // Calculate where the leg *wants* to be based on current body pos
        s.idealPos.set(config.idealX, 0, config.idealZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)
        
        // Calculate body attachment point
        s.basePos.set(config.baseX, 0, config.baseZ)
            .applyQuaternion(bodyRef.current.quaternion)
            .add(bodyRef.current.position)

        // Step logic
        const distToIdeal = s.currentPos.distanceTo(s.idealPos)
        
        if (!s.isStepping && distToIdeal > STEP_THRESHOLD) {
            // Trigger step if far enough (could add gait sync here for more realism)
            // Wait to step until it's "our group's turn" by adding a time/frame based offset or 
            // relying on natural stagger. For now, distance threshold creates organic stepping.
            s.isStepping = true
            s.stepProgress = 0
            // Overshoot the ideal slightly to anticipate movement
            const velocityDir = new THREE.Vector3().subVectors(s.idealPos, s.currentPos).normalize().multiplyScalar(0.5)
            s.targetPos.copy(s.idealPos).add(velocityDir)
        }

        if (s.isStepping) {
            s.stepProgress += dt * 8 // step speed
            if (s.stepProgress >= 1) {
                s.stepProgress = 1
                s.isStepping = false
            }

            // Parabolic arc interpolation for the step
            s.currentPos.lerpVectors(s.currentPos, s.targetPos, s.stepProgress)
            // add arc height
            const arc = Math.sin(s.stepProgress * Math.PI) * STEP_HEIGHT
            s.currentPos.y = arc
        } else {
             // stick to ground
             s.currentPos.y = 0
        }

        if (footRef.current) {
            footRef.current.position.copy(s.currentPos)
        }

        // Draw bezier curve for the leg (Jointed look)
        if (lineRef.current) {
            // Control point for quadratic curve: halfway between base and foot, but raised up
            const midPoint = s.basePos.clone().lerp(s.currentPos, 0.5)
            midPoint.y = Math.max(s.basePos.y, s.currentPos.y) + 1.5 // Knees high

            const posArray = lineRef.current.geometry.attributes.position.array as Float32Array
            for (let i = 0; i < 30; i++) {
                const t = i / 29
                // Quadratic Bezier Formula: P(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
                const t1 = 1 - t
                s.p1.copy(s.basePos).multiplyScalar(t1 * t1)
                s.p2.copy(midPoint).multiplyScalar(2 * t1 * t)
                const point = s.p1.add(s.p2).add(s.currentPos.clone().multiplyScalar(t * t))
                
                posArray[i * 3] = point.x
                posArray[i * 3 + 1] = point.y
                posArray[i * 3 + 2] = point.z
            }
            lineRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    return (
        <group>
            {/* The leg line */}
            <ThreeLine ref={lineRef} geometry={geom}>
                <lineBasicMaterial color={color} linewidth={2} />
            </ThreeLine>
            
            {/* The foot point */}
            <mesh ref={footRef}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color={color} />
                {/* Small glow blob on foot */}
                <pointLight distance={1.5} intensity={1} color={color} />
            </mesh>
        </group>
    )
}

function Spider({ isDragging, bodyRef }: { isDragging: boolean, bodyRef: React.RefObject<THREE.Group> }) {
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

    const bodyColor = "#0080FF"
    const legColor = "#7B2FFF" // Purple

    return (
        <group>
            {/* Spider Body Chassis */}
            <group ref={bodyRef}>
                <mesh position={[0, 0, 0]}>
                    <octahedronGeometry args={[BODY_RADIUS, 1]} />
                    <meshStandardMaterial color={bodyColor} wireframe={true} emissive={bodyColor} emissiveIntensity={0.5} opacity={0.8} transparent />
                </mesh>
                {/* Core engine glow */}
                <pointLight distance={5} intensity={2} color={bodyColor} />
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[BODY_RADIUS * 0.4, 16, 16]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            </group>

            {/* 8 Legs */}
            {legConfigs.map((config, i) => (
                <SpiderLeg key={i} config={config} bodyRef={bodyRef} color={legColor} />
            ))}
        </group>
    )
}

function Leash({ isDragging, bodyRef }: { isDragging: boolean, bodyRef: React.RefObject<THREE.Group> }) {
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
    const [isDragging, setIsDragging] = useState(false)
    const bodyRef = useRef<THREE.Group>(null)

    useEffect(() => {
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

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <Canvas shadows={false} dpr={[1, 2]} eventSource={document.documentElement} eventPrefix="client">
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
