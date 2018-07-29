export type RawWowzaModel = {
	WowzaMediaServer?: RawWowzaStreamObject,
	WowzaStreamingEngine?: RawWowzaStreamObject
}

export type RawWowzaStreamObject = { Stream: RawWowzaStreamWrapper[] }

export type RawWowzaStreamWrapper = { $: RawWowzaStream }

export type RawWowzaStream = {
	vhostName: string,
	applicationName: string,
	appInstanceName: string,
	streamName: string,
	sessionsFlash: string,
	sessionsCupertino: string,
	sessionsSanJose: string,
	sessionsSmooth: string,
	sessionsRTSP: string,
	sessionsTotal: string
}