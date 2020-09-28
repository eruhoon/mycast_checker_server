export class Config {
    // DEFAULT PORT
    public static DEFAULT_PORT: number = 9000;

    public static NEED_EXP = [
        0,
        15,
        34,
        57,
        92,
        135,
        372,
        560,
        840,
        1242,
        1242,
        1242,
        1242,
        1242,
        1242,
        1490,
        1788,
        2146,
        2575,
        3090,
        3708,
        4450,
        5340,
        6408,
        7690,
        9228,
        11074,
        13289,
        15947,
        19136,
        19136,
        19136,
        19136,
        19136,
        19136,
        22963,
        27556,
        33067,
        39680,
        47616,
        51425,
        55539,
        59982,
        64781,
        69963,
        75560,
        81605,
        88133,
        95184,
        102799,
        111023,
        119905,
        129497,
        139857,
        151046,
        163130,
        176180,
        190274,
        205496,
        221936,
        239691,
        258866,
        279575,
        301941,
        326096,
        352184,
        380359,
        410788,
        433651,
        479143,
        479143,
        479143,
        479143,
        479143,
        479143,
        512683,
        548571,
        586971,
        629059,
        672023,
        719065,
        769400,
        823258,
        880886,
        943548,
        1008526,
        1079123,
        1154662,
        1235448,
        1321372,
        1414510,
        1513516,
        1619473,
        1732836,
        1854135,
        1983924,
        2122799,
        2271395,
        2430393,
        2600521,
    ];
    public static MAX_LEVEL = 100;

    public static getMaxLevel(): number {
        return this.MAX_LEVEL;
    }

    public static getNeedExp(level: number) {
        if (level > this.MAX_LEVEL) return -1;
        return this.NEED_EXP[level];
    }

    public static isDebugMode(): boolean {
        return process.env.DEBUG_MODE === "true";
    }

    public static isHttpsEnabled(): boolean {
        return process.env.ENABLE_HTTPS === "true";
    }

    public static getDefaultPort(): number {
        const customPort = parseInt(process.env.SERVER_PORT);
        if (!customPort) {
            return this.DEFAULT_PORT;
        } else {
            return customPort;
        }
    }

    public static getYoutubeApiKey(): string {
        return process.env.YOUTUBE_API_KEY;
    }
}
