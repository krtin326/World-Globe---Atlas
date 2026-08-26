/**
 * @license
 * Copyright 2010-2026 three.js authors
 * SPDX-License-Identifier: MIT
 *
 * Vendored from the three.js distribution (examples/jsm). Full licence text:
 * vendor/LICENSE.three.txt
 */
/**
 * @module CopyShader
 * @three_import import { CopyShader } from 'three/addons/shaders/CopyShader.js';
 */

/**
 * Full-screen copy shader pass.
 *
 * @constant
 * @type {ShaderMaterial~Shader}
 */
const CopyShader = {

	name: 'CopyShader',

	uniforms: {

		'tDiffuse': { value: null },
		'opacity': { value: 1.0 }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`

};

export { CopyShader };
