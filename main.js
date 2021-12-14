const $ = s => document.querySelector(s)

const sen = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮" // "お寿司は日本の伝統な食べ物です"

const $map = $("#map")
let $tmp

const delta = [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ]

const check = () => [ ...$map.children ].map($i => $i.innerHTML).join("") === sen + " "

let tid
let stt = "start"

const gen = () => {
	stt = "play"
	if (tid !== undefined) clearInterval(tid)
	let min = 0, sec = 0
	tid = setInterval(() => {
		if (stt === "play") $time.innerHTML = `${min}:${sec}`
		sec ++
		if (sec === 60) sec = 0, min ++
	}, 1000)
	$map.innerHTML = ""

	const chao = [ ...sen ].sort(() => Math.random() - .5)
	for (let i = 0; i <= 16; i ++) {
		const $b = document.createElement("span")
		$b.id = `b-${i}`
		$map.appendChild($b)
		if (i == 16) {
			$tmp = $b
			break
		}

		$b.dataset.x = i % 4
		$b.dataset.y = ~~ (i / 4)
		$b.innerHTML = chao[i] ?? " "
		$b.onclick = evt => {
			const $cur = evt.currentTarget
			const x = + $cur.dataset.x
			const y = + $cur.dataset.y
			for (const [ dx, dy ] of delta) {
				const x_ = x + dx
				const y_ = y + dy
				if (x_ < 0 || x_ > 3 || y_ < 0 || y_ > 3)
					continue
				const $nxt = $(`span[data-x="${x_}"][data-y="${y_}"]`)
				if ($nxt.id === "b-15") {
					$nxt.dataset.x = $cur.dataset.x
					$nxt.dataset.y = $cur.dataset.y
					$cur.dataset.x = x_
					$cur.dataset.y = y_

					$map.replaceChild($tmp, $cur)
					$map.replaceChild($cur, $nxt)
					$map.replaceChild($nxt, $tmp)

					if (check()) {
						$time.innerHTML = `<b>Win! in ${min}:${sec}</b>`
						stt = "win"
						clearInterval(tid)
						tid = undefined
					}

					break
				}
			}
		}
	}
}

const stt_op = {
	start: gen,
	play: () => {
		stt = "start"
		$time.innerHTML = "Click again to REstart"
		setTimeout(() => {
			stt = "play"
		}, 3000)
	}
}

const $time = $("#time")
$time.onclick = () => stt_op[stt]()
