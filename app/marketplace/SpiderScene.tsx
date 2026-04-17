'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Environment, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'

// Spider Configuration
const BODY_RADIUS = 0.8

function Spider() {
    const bodyRef = useRef<THREE.Group>(null)
    const { pointer, camera } = useThree()
    const targetPos = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
    const raycaster = useRef(new THREE.Raycaster())

    useFrame((state, dt) => {
        // Find intersection of mouse with ground plane
        raycaster.current.setFromCamera(pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, targetPos.current)
        
        // Add some hovering bob to the target body height
        targetPos.current.y = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.2

        if (bodyRef.current) {
            // Smoothly move body towards mouse
            easing.damp3(bodyRef.current.position, targetPos.current, 0.2, dt)
            
            // Rotate body to face movement direction (if moving fast enough)
            const dir = new THREE.Vector3().subVectors(targetPos.current, bodyRef.current.position)
            dir.y = 0
            if (dir.lengthSq() > 0.01) {
                const targetRotation = Math.atan2(dir.x, dir.z)
                // easing.dampAngle doesn't natively exist simply in maath string format, we can do quaternion spherical lerp
                const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation)
                easing.dampQ(bodyRef.current.quaternion, targetQuat, 0.2, dt)
            }
        }
    })

    const bodyColor = "#0080FF"

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
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
        </mesh>
    )
}

export function SpiderScene() {
    // Use a state to securely attach global document events without hydration errors
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {mounted && (
                <Canvas shadows={false} dpr={[1, 2]} eventSource={document.documentElement} eventPrefix="client">
                {/* Top-down view creates the 'single 2D plane' feel */}
                <PerspectiveCamera makeDefault position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} fov={40} />
                {/* Remove background color to make canvas transparent so user can see text below */}
                {/* <color attach="background" args={['#030305']} /> */}
                
                <ambientLight intensity={0.5} />
                
                {/* Subtle tech grid floor */}
                <gridHelper args={[50, 50, '#ffffff', '#ffffff']} position={[0, -0.01, 0]} material-opacity={0.05} material-transparent />
                
                {/* Ground plane for raycasting (invisible) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                <Spider />
                <Leash />

                {/* Floating ambient particles for sci-fi feel */}
                <Sparkles count={100} scale={20} size={2} speed={0.4} color="#00ffff" opacity={0.2} />

                {/* Environment for shiny reflections if we use PBR */}
                <Environment preset="city" />
            </Canvas>
            )}
        </div>
    )
}
