
// 定数
const ALG_PLAIN = 0;           // mot de passe en clair : ne fonctionnera pas sur les serveurs Unix
const ALG_CRYPT = 1;           // chiffrement par la fonction crypt() d'Unix
const ALG_APMD5 = 2;           // chiffrement en MD5, utilisé par défaut sous Windows entre autres.
const ALG_APSHA = 3;           // chiffrement en SHA-1
const AP_SHA1PW_ID = "{SHA}";
const AP_MD5PW_ID = "$apr1$";

// n文字以上の数値vをbase-64に変換します。Apache 1.3のコードから派生した機能
let itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";  /* 0 ... 63 => ASCII - 64 */
function ap_to64(v, n) {
	let s = '';
	while (--n >= 0) {
		s += itoa64.charAt(v & 0x3f);  // 右端の6ビットを取ります。
		v >>>= 6;                    // 6ビットずつシフトします。
	}
	return s;
}

// 文字列をASCIIコードの配列に変換します。
function stringToArray(s) {
	let a = [];
	for (let i = 0; i < s.length; i++) a.push(s.charCodeAt(i));
	return a;
}

function htpasswd(user, pw, alg) {
	/*
	if (!user || !pw) {
	alert('Il faut un nom d\'utilisateur et un mot de passe.');
	return '';
	}
	*/
	// un peu de sel pour mettre dans les mots de passe en MD5 ou Crypt : 8 caractères aléatoires en base 64.
	// On fait 4 + 4, parce que 8 caractères c'est trop pour être stocké dans un entier.
	let salt = ap_to64(Math.floor(Math.random() * 16777215), 4)    // 2^24-1 : 4 * 6 bits.
		+ ap_to64(Math.floor(Math.random() * 16777215), 4);   // 2^24-1 : 4 * 6 bits.


	let plus127 = 0;
	for (let i = 0; i < user.length; i++) if (user.charCodeAt(i) > 127) plus127++;
	if (plus127) alert("Apache doesn't like non-ascii characters in the user name.");

	let cpw = '';         // Mot de passe chiffré ; max 119 caractères.
	switch (alg) {
		/*
		 * output of base64 encoded SHA1 is always 28 chars + AP_SHA1PW_ID length (ce qui fait 33 caractères)
		 */
		case ALG_APSHA:
			cpw = AP_SHA1PW_ID + b64_sha1(pw);
			break;

		case ALG_APMD5:
			let msg = pw;          // On commence par le mot de passe en clair
			msg += AP_MD5PW_ID;    // puis le petit mot magique
			msg += salt;           // et un peu de sel.
			/*
			 * Then just as many characters of the MD5(pw, salt, pw)
			 */
			let final_ = str_md5(pw + salt + pw);
			for (let pl = pw.length; pl > 0; pl -= 16) msg += final_.substr(0, (pl > 16) ? 16 : pl);

			/*
			 * Then something really weird...
			 */
			for (i = pw.length; i != 0; i >>= 1)
				if (i & 1) msg += String.fromCharCode(0);
				else msg += pw.charAt(0);
			final_ = str_md5(msg);

			/*
			 * Ensuite une partie pour ralenir les choses ! En JavaScript ça va être vraiment lent !
			 */
			let msg2;
			for (i = 0; i < 1000; i++) {
				msg2 = '';
				if (i & 1) msg2 += pw; else msg2 += final_.substr(0, 16);
				if (i % 3) msg2 += salt;
				if (i % 7) msg2 += pw;
				if (i & 1) msg2 += final_.substr(0, 16); else msg2 += pw;
				final_ = str_md5(msg2);
			}
			final_ = stringToArray(final_);

			/*
			 * Now make the output string.
			 */
			cpw = AP_MD5PW_ID + salt + '$';
			cpw += ap_to64((final_[0] << 16) | (final_[6] << 8) | final_[12], 4);
			cpw += ap_to64((final_[1] << 16) | (final_[7] << 8) | final_[13], 4);
			cpw += ap_to64((final_[2] << 16) | (final_[8] << 8) | final_[14], 4);
			cpw += ap_to64((final_[3] << 16) | (final_[9] << 8) | final_[15], 4);
			cpw += ap_to64((final_[4] << 16) | (final_[10] << 8) | final_[5], 4);
			cpw += ap_to64(final_[11], 2);
			break;

		case ALG_PLAIN:
			cpw = pw;
			break;

		case ALG_CRYPT:
		default:
			cpw = Javacrypt.displayPassword(pw, salt);
			break;
	}

	/*
	 * Check to see if the buffer is large enough to hold the username,
	 * hash, and delimiters.
	 */
	if (user.length + 1 + cpw.length > 255) alert('Your login and password are too long.');
	else return user + ':' + cpw;
}

//=========================================
// パスワードの生成
//=========================================
function pwgen(pwl) {
	// アクセント付きの文字を含む他の文字を置くことができます（ただし、以下の場合に限ります）。
	// エンコーダー、クライアント、サーバーの3つのシステムで同じASCIIコードを使用しています。)
	// しかし、文字数よりもパスワードのサイズを大きくすることで得られるものは大きい。
	let source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-#$@+_()[]{}=%*!§";
	let pw = '';
	for (let i = 1; i <= pwl; i++) {
		pw += source.substr(Math.floor(Math.random() * source.length), 1);
	}
	return pw;
}

function generation(f) {
	let pw = pwgen(f.taille.options[f.taille.selectedIndex].text);
	f.pwd1.value = pw;
	f.pwd2.value = htpasswd(f.user.value, pw, f.alg.selectedIndex);
}
