const $ = s => document.querySelector(s)
Math.rand = max => ~~ (Math.random() * 1e6) % max

const sens = [
	"①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮",
	"お寿司は日本の伝統な食べ物です",
	"鞄の中には寿司が五つありました",
	"今朝施さんに寿司をもらいました",
	"１週間このゲームを開発しますね"
]
let won_sens
let sen_id

const $map = $("#map")
let $tmp
const $block = (x, y) => $(`span[data-x="${x}"][data-y="${y}"]`)

const $rank = $("#rank")

const delta = [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ]
const key_delta = {
	ArrowLeft:		[ -1, 0 ],
	ArrowRight:	[ 1, 0 ],
	ArrowUp:		[ 0, -1 ],
	ArrowDown:	[ 0, 1 ]
}
const linal_delta = [
	[ x => x % 4,	-1 ],
	[ x => (x + 1) % 4,	1 ],
	[ x => x >= 4,	-4 ],
	[ x => x < 12,	4 ]
]

const is_xy_invalid = (x, y) => x < 0 || x > 3 || y < 0 || y > 3

let debug = {
	immediate_win: false,
	delete_record: false,
	shuffle_time: 1e6
}

const have_won = () => debug.immediate_win || [ ...$map.children ].map($i => $i.innerHTML).join("") === sens[sen_id] + " "

let t_time, t_info, t0
let stt = "start"
let min, sec

const record_win = () => {
	stt = "win"

	sec = (Date.now() - t0) % 1e6 / 1e3
	min = ~~ (sec / 60)
	sec = ~~ (sec % 60 * 1e3) / 1e3

	$info.innerHTML = `<b id="win">Win!</b> in <u>${min}:${sec}</u>`
	clearInterval(t_time)
	t_time = undefined

	const l = rank()
	const $new = document.createElement("li")
	$new.innerHTML = `by <input id="name" /> in <del></del> <u>${min}:${sec}</u>`

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

	won_sens.push(sen_id)
	localStorage.sen = JSON.stringify(won_sens)
}

const gen = () => {
	stt = "play"

	won_sens = JSON.parse(localStorage.sen ?? "[]")

	if (sens.length === won_sens .length) {
		$info.innerHTML = "All cleared..."
		return
	}
	do sen_id = Math.rand(sens.length)
	while (won_sens.includes(sen_id))

	const chao = [ ...sens[sen_id], " " ]
	let emp = 15
	for (let i = 0; i < debug.shuffle_time; i ++) {
		const [ checker, d ] = linal_delta[ Math.rand(4) ]
		if (! checker(emp)) continue
		[ chao[emp], chao[emp + d] ] = [ chao[emp + d], chao[emp] ];
		emp += d
	}

	$map.innerHTML = ""
	for (let i = 0; i <= 16; i ++) {
		const $b = document.createElement("span")
		$map.appendChild($b)

		const ch = chao[i]
		if (ch === " ") $b.id = "emp"
		if (! ch) {
			$b.id = "tmp"
			$tmp = $b
			break
		}

		$b.dataset.x = i % 4
		$b.dataset.y = ~~ (i / 4)
		$b.innerHTML = chao[i]
		$b.addEventListener("click", move.mouse)
	}

	$info.innerHTML = "<u>0:0</u>"
	
	clearInterval(t_time)
	clearInterval(t_info)

	t0 = Date.now(), min = 0, sec = 0
	t_time = setInterval(() => {
		if (stt === "play") $info.innerHTML = `<u>${min}:${sec}</u>`
		if (stt === "win") return
		sec ++
		if (sec === 60) sec = 0, min ++
	}, 1000)
}

const move = {
	do: ($e1, $e2) => {
		$map.replaceChild($tmp, $e2)
		$map.replaceChild($e2, $e1)
		$map.replaceChild($e1, $tmp)

		; [ $e1.dataset.x, $e2.dataset.x ] = [ $e2.dataset.x, $e1.dataset.x ]
		; [ $e1.dataset.y, $e2.dataset.y ] = [ $e2.dataset.y, $e1.dataset.y ]
	},

	mouse: evt => {
		if (stt !== "play") return
		const $cur = evt.currentTarget
		const { x, y } = $cur.dataset
		for (const [ dx, dy ] of delta) {
			const x_ = + x + dx
			const y_ = + y + dy
			if (is_xy_invalid(x_, y_)) continue

			const $nxt = $block(x_, y_)
			if ($nxt.id === "emp") {
				move.do($cur, $nxt)
				if (have_won()) record_win()
				break
			}
		}
	},

	keyboard: evt => {
		if (stt !== "play") return
		const d = key_delta[evt.key]
		if (! d) return

		const $emp = $("#emp")
		const { x, y } = $emp.dataset
		const [ dx, dy ] = d
		const x_ = x - dx
		const y_ = y - dy

		if (is_xy_invalid(x_, y_)) return
		move.do($emp, $block(x_, y_))
		if (have_won()) record_win()
	}
}

document.addEventListener("keydown", move.keyboard)

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
					const $old_time = $old.children[1]
					const $new_time = $old.children[2]
					$old_time.innerHTML = $new_time.innerHTML
					$new_time.innerHTML = `${min}:${sec}`
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
const exe_op = evt => stt_op[stt](evt)

const $info = $("#info")
$info.addEventListener("click", exe_op)
document.addEventListener("keydown", evt => {
	if (evt.key === "Enter") exe_op(evt)
})

rank().forEach(([ name, min, sec ]) => {
	const $l = document.createElement("li")
	$l.innerHTML = `by <strong>${name}</strong> in <del></del> <u>${min}:${sec}</u>`
	$rank.appendChild($l)
})
