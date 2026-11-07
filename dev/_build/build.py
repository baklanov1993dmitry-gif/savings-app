import re,pathlib
R=pathlib.Path(__file__).resolve().parent.parent
rd=lambda p:(R/p).read_text(encoding='utf8')
h=rd('src/app.html')
lib=(R/'_build/node_modules/xlsx/dist/xlsx.mini.min.js').read_text(encoding='utf8').replace('</script','<\\/script')
for k,v in {'/*STYLE*/':rd('src/style.css'),'/*LIBS*/':lib,'/*CRYPTO*/':rd('src/crypto.js'),'/*DATA*/':rd('src/data.js'),'/*CHARTS*/':rd('src/charts.js'),'/*UI*/':rd('src/ui.js'),'/*SYNC*/':rd('src/sync.js'),'/*WEBAUTHN*/':rd('src/webauthn.js'),'/*ANALYSIS*/':rd('src/analysis.js'),'/*FX*/':rd('src/fx.js'),'/*CALC*/':rd('src/calc.js'),'/*BOARD*/':rd('src/board.js'),'/*FLOWS*/':rd('src/flows.js'),'/*INSIGHT*/':rd('src/insight.js'),'/*APP*/':rd('src/app.js')}.items():
    h=h.replace(k,v)
out=R/'savings.html'; out.write_text(h,encoding='utf8'); print(out,len(h)//1024,'KB')

(R/'pwa').mkdir(exist_ok=True);(R/'pwa/index.html').write_text(h,encoding='utf8')
