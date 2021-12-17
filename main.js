const $ = s => document.querySelector(s)
const sen = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮"
"お寿司は日本の伝統な食べ物です"

const $map = $("#map")
let $tmp

const $rank = $("#rank")

const delta = [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ]

let debug = {
	immediate_win: false
}

const have_won = () => debug.immediate_win || [ ...$map.children ].map($i => $i.innerHTML).join("") === sen + " "

let t_time, t_info, t_0
let stt = "start"
let min, sec

const record_win = () => {
	sec = (Date.now() - t_0) % 1e6 / 1e3
	$info.innerHTML = `<b id="win">Win!</b> in <u>${min}:${sec}</u>`
	stt = "win"
	clearInterval(t_time)
	t_time = undefined

	const l = rank()
	const $new = document.createElement("li")
	$new.innerHTML = `by <input id="name" /> in <u>${min}:${sec}</u>`

	let is_last = ! l.length
	let i
	if (! is_last) {
		i = l.findIndex(([, min1, sec1 ]) => min1 > min || min1 === min && sec1 > sec)
		if (i < 0) is_last = true
	}
	$rank.appendChild($new)
	if (! is_last) {
		const $before = $rank.children[i]
		$rank.insertBefore($new, $before)
	}
}

const gen = () => {
	stt = "play"
	
	clearInterval(t_time)
	clearInterval(t_info)

	t_0 = Date.now(), min = 0, sec = 0
	t_time = setInterval(() => {
		if (stt === "play") $info.innerHTML = `<u>${min}:${sec}</u>`
		if (stt === "win") return
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
			if (stt !== "play") return
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

					if (have_won()) record_win()

					break
				}
			}
		}
	}
}

const rank = () => JSON.parse(localStorage.rank ?? "[]")
rank.mod = cb => {
	const m = cb(rank())
	if (m) localStorage.rank = JSON.stringify(m)
}

const stt_op = {
	start: gen,
	play: () => {
		stt = "start"
		$info.innerHTML = "Restart"
		t_info = setTimeout(() => {
			stt = "play"
		}, 3000)
	},
	win: () => {
		stt = "start"
		$info.innerHTML = "Start"

		const $input = $("#name")
		const name = $input.value || "Anonymous"

		let use_old = false
		rank.mod(l => {
			const [ i, old ] = [ ...l.entries() ].find(([, v ]) => name === v[0]) ?? []
			if (old) {
				use_old = true
				$rank.removeChild($input.parentElement)
				const $old = $rank.children[i]
				if (min < old[1] || min === old[1] && sec < old[2]) {
					old[1] = min
					old[2] = sec
					$old.innerHTML = $old.innerHTML.replaceAll("u", "del") + `<u>${min}:${sec}</u>`
					return l
				}
				return 
			}
		})
		if (use_old) return

		const $i = $input.parentElement
		$i.innerHTML = $i.innerHTML.replace(`<input id="name">`, `<strong>${name}</strong>`)

		rank.mod(l => {
			l.push([ name , min, sec ])
			return l.sort(([, min1, sec1 ], [, min2, sec2 ]) => min1 - min2 || sec1 - sec2)
		})
	}
}

const $info = $("#info")
$info.onclick = evt => stt_op[stt](evt)
	
rank().forEach(([ name, min, sec ]) => {
	const $l = document.createElement("li")
	$l.innerHTML = `by <strong>${name}</strong> in <u>${min}:${sec}</u>`
	$rank.appendChild($l)
})
