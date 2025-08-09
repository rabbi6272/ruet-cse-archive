class Protector {
    constructor(timestamp) {
        this.lowerLetters = "abcdefghijklmnopqrstuvwxyz";
        this.upperLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.symbols = ".,!?::;#$%^*(){}[]'\"<>\\/-_@";
        this.numbers = "0123456789";
        this.ts = timestamp;
    }

    encrypt(data) {
        // data safety 4 layers
        let rLl = this.random(0, this.lowerLetters.length - 1);
        let rUl = this.random(0, this.upperLetters.length - 1);
        let rSl = this.random(0, this.symbols.length - 1);
        let rNl = this.random(0, this.numbers.length - 1);

        // key safety 4 layers
        let sec = (this.ts instanceof Date ? this.ts.getSeconds() : new Date(this.ts).getSeconds()) % 4;
        let key;
        switch (sec) {
            case 0:
                key = `${this.bin(+rLl)}_${this.bin(+rUl)}_${this.bin(-rSl)}_${this.bin(-rNl)}`;
                break;
            case 1:
                key = `${this.bin(-rLl)}_${this.bin(-rUl)}_${this.bin(+rSl)}_${this.bin(+rNl)}`;
                break;
            case 2:
                key = `${this.bin(+rLl)}_${this.bin(-rUl)}_${this.bin(+rSl)}_${this.bin(-rNl)}`;
                break;
            case 3:
                key = `${this.bin(-rLl)}_${this.bin(+rUl)}_${this.bin(-rSl)}_${this.bin(+rNl)}`;
                break;
            default:
                key = `${this.bin(rLl)}_${this.bin(rUl)}_${this.bin(rSl)}_${this.bin(rNl)}`;
        }

        // encrypt through 4 Caesar shifts
        let encrypted = this.caesarShift(data, rLl, this.lowerLetters);
        encrypted = this.caesarShift(encrypted, rUl, this.upperLetters);
        encrypted = this.caesarShift(encrypted, rSl, this.symbols);
        encrypted = this.caesarShift(encrypted, rNl, this.numbers);

        // confusion key
        let dummyKey = `${this.bin(this.random(0, 25))}_${this.bin(this.random(0, 25))}_${this.bin(this.random(0, this.symbols.length - 1))}_${this.bin(this.random(0, 9))}`;
        if (data.length % 2 === 1) {
            return `{${dummyKey}}${encrypted}{${key}}`;
        } else {
            return `{${key}}${encrypted}{${dummyKey}}`;
        }
    }

    decrypt(data) {
    let matches = data.match(/\{([^}]*)\}/g);
    if (!matches || matches.length !== 2) return null;

    let textWithoutKeys = data.replace(/\{[^}]*\}/g, "");
    let firstKey = matches[0].replace(/[{}]/g, "");
    let secondKey = matches[1].replace(/[{}]/g, "");

    let realKey = (textWithoutKeys.length % 2 === 1) ? secondKey : firstKey;
    let parts = realKey.split("_").map(k => {
        if (k.startsWith("-")) return -parseInt(k.slice(1), 2);
        return parseInt(k, 2);
    });

    // Use timestamp to decide how to read shifts
    let sec = (this.ts instanceof Date ? this.ts.getSeconds() : new Date(this.ts).getSeconds()) % 4;
    let rLl, rUl, rSl, rNl;

    switch (sec) {
        case 0: [rLl, rUl, rSl, rNl] = [parts[0], parts[1], -parts[2], -parts[3]]; break;
        case 1: [rLl, rUl, rSl, rNl] = [-parts[0], -parts[1], parts[2], parts[3]]; break;
        case 2: [rLl, rUl, rSl, rNl] = [parts[0], -parts[1], parts[2], -parts[3]]; break;
        case 3: [rLl, rUl, rSl, rNl] = [-parts[0], parts[1], -parts[2], parts[3]]; break;
        default:[rLl, rUl, rSl, rNl] = parts;
    }

    let decrypted = this.caesarShift(textWithoutKeys, -rNl, this.numbers);
    decrypted = this.caesarShift(decrypted, -rSl, this.symbols);
    decrypted = this.caesarShift(decrypted, -rUl, this.upperLetters);
    decrypted = this.caesarShift(decrypted, -rLl, this.lowerLetters);

    return decrypted;
}


    caesarShift(str, shift, charset) {
        let chars = charset.split("");
        let len = chars.length;
        let result = "";

        for (let i = 0; i < str.length; i++) {
            let ch = str[i];
            let idx = chars.indexOf(ch);

            if (idx === -1) {
                //character out of list
                result += ch;
            } else {
                let newIdx = (idx + shift) % len;
                if (newIdx < 0) {
                    newIdx += len;
                }
                result += chars[newIdx];
            }
        }

        return result;
    }

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    bin(num) {
        return (num < 0 ? "-" : "") + Math.abs(num).toString(2);
    }

    hex(num) {
        return num.toString(16);
    }
}


// let enc = new Protector(//timestamp needed);
// let cipher = enc.encrypt("Hello everyone");
// console.log("Encrypted:", cipher);
// console.log("Decrypted:", enc.decrypt(cipher));

export {Protector};
