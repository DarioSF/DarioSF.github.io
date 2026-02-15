---
title: "CANtegrity"
summary: "Telemetry & Command Stack: framing robusto + CRC + ring buffer SPSC + máquina de estados, reproducible en simulación y con tests automatizados."
tags: ["embedded", "telemetry", "uart", "protocol", "reliability"]
date: "2026-02-15"
status: "concept"
featured: true
---


## Resumen

CANtegrity es un “Telemetry & Command Stack” diseñado como módulo de comunicaciones para sistemas embebidos:
enmarcado robusto sobre un flujo de bytes (p. ej. UART), integridad mediante CRC, ring buffer eficiente entre ISR y lazo principal,
y una máquina de estados para comandos/respuestas tolerante a ruido. El objetivo es que sea reproducible en simulación y validado con tests automatizados.

## Objetivo del producto

- **Framing robusto** para stream de bytes (UART / similar).
- **Detección de errores** con CRC (CRC32C por defecto y CRC16 opcional).
- **Búfer circular SPSC** (Single-Producer Single-Consumer): productor en ISR, consumidor en bucle principal.
- **Máquina de estados** para comandos y respuestas con contadores, timeouts y tolerancia a “basura/ruido”.
- **Reproducibilidad**: ejecución en simulación/emulación + test automatizado sin placa.

## Arquitectura (targets)

El diseño se plantea con dos entornos de referencia:

### A) ARM Cortex-M4 (microcontrolador común)

- CPU: Cortex-M4 (bajo consumo, frecuente en embedded industrial).
- ISA: Thumb-2.
- Lenguaje: ensamblador ARM/Thumb (GNU as).
- Simulación: Renode (tests sin hardware).

### B) RISC-V RV32IMC (moderno y cómodo para emulación)

- RV32: 32-bit.
- I: instrucciones enteras base.
- M: multiplicación/división por hardware.
- C: instrucciones comprimidas.
- Lenguaje: ensamblador RISC-V (GNU as).
- Simulación: QEMU (emulación estándar).

## Protocolo de comunicación

### Framing: COBS

COBS (Consistent Overhead Byte Stuffing) permite delimitar paquetes en un stream de bytes sin depender de caracteres especiales “conflictivos”.
El framing está pensado para ser robusto frente a ruido, pérdidas parciales y desincronización.

### Integridad: CRC32C + CRC16 opcional

- **CRC32C (Castagnoli)** por defecto: buena capacidad de detección de errores, ampliamente usado en sistemas modernos.
- **CRC16-CCITT** opcional: modo “ligero” para reducir coste de CPU si se necesita.

### Formato del frame (versionado y extensible)

Paquete dentro del frame COBS:

- **MAGIC** (2 bytes): firma fija para filtrar basura.
- **VER** (1 byte): versión de protocolo (compatibilidad futura).
- **TYPE** (1 byte): telemetría / comando / respuesta / error.
- **SEQ** (1 byte): número de secuencia (trazabilidad/reintentos).
- **LEN** (1 byte): longitud del payload.
- **PAYLOAD** (0..N bytes): datos.
- **CRC** (4 bytes por defecto): CRC32C de header + payload.

**Tamaño recomendado:** hasta 128 bytes de payload (suficiente para telemetría/comandos sin comprometer RAM en MCU).

## Conjunto de comandos (borrador inicial)

Todos los comandos responden con **ACK/NACK** y un código de error.

- `GET_VERSION` → versión de firmware/protocolo.
- `GET_STATUS` → estado + uptime + flags.
- `SET_TELEM_RATE` → ajustar frecuencia de telemetría.
- `GET_COUNTERS` → frames válidos, CRC fail, overruns, timeouts.
- `ECHO` → pruebas de canal y latencia.
- `ENTER_SAFE_MODE` → cambio a modo seguro (demuestra máquina de estados).
- `RESET` → opcional para demo (si se considera seguro).

## Concurrencia: ring buffer SPSC (ISR → main)

- **Productor:** ISR (Interrupt Service Routine), p. ej. RX por UART.
- **Consumidor:** bucle principal.
- Objetivo: transferencia eficiente de bytes/frames sin bloqueos, minimizando trabajo en interrupción y manteniendo contadores para diagnóstico (overrun, drops, etc.).

## Estado actual

**Concept / por iniciar.** En esta fase:

- Se está cerrando especificación de protocolo, límites, contadores y estructura de tests.
- Se definirá el “mínimo viable” (MVP) para publicar la primera versión funcional en simulación.

## Plan de validación (previsto)

- Tests unitarios de COBS y CRC (casos conocidos + casos aleatorios).
- Tests de robustez: inyección de ruido/basura, pérdidas parciales, desincronización y re-sync.
- Tests de throughput y latencia (tamaño de payload, tasa de frames, overrun).
- Tests en simulación (Renode / QEMU) para asegurar reproducibilidad.

## Próximos pasos

- Implementar el framing COBS + CRC (CRC32C por defecto).
- Añadir máquina de estados: parseo, timeouts, ACK/NACK y contadores.
- Integrar ring buffer SPSC ISR→main y métricas (overrun, drops, CRC fail).
- Montar harness de tests automatizados (incluyendo fuzzing simple de frames).
