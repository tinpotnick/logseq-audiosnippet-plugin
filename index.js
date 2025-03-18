
const timestampIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
<circle cx="12" cy="12" r="10"></circle>
<polyline points="12 6 12 12 16 14"></polyline>
</svg>`


function main() {

  logseq.provideStyle(`
    .audio-snippet-inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: var(--ls-link-text-color);
      text-decoration: none;
    }
    .audio-snippet-inline svg {
      vertical-align: middle;
      stroke: var(--ls-link-text-color);
    }
  `)

  let keyindex = 0

  logseq.App.onMacroRendererSlotted(({ slot, payload: { arguments } }) => {

    const thisindex = keyindex++
    const key = `audioSnippet${thisindex}`

    const [ name, start, stop ] = arguments[ 0 ].split( " " )

    let range = `${start}s–${stop}s`
    if( !stop ) {
      range = `${start}`
    }

    const template = 
      `<span id="${key}" class="audio-snippet-inline" title="Play snippet">
        ${timestampIcon} <span>${range}</span>
       </span>
      `

    logseq.provideUI( {
      key,
      slot,
      template,
      placement: "inline",
      reset: true
    } )

    setTimeout(() => {
      const el = parent.document.getElementById( key )
      if ( !el ) return

      el.addEventListener( "click", ( event ) => {
        const div = event.target.closest( 'div[haschild="true"]' )
        const audio = div.querySelector( "audio" )
        if ( !audio ) return

        audio.currentTime = start
        audio.play()

        if( !stop ) return /* optional */

        const stopHandler = () => {
          if ( audio.currentTime < stop ) return

          audio.pause()
          audio.removeEventListener( "timeupdate", stopHandler )
        }
      
        audio.addEventListener( "timeupdate", stopHandler )
      } )
    }, 0 )
  } )
}

logseq.ready( main ).catch( console.error )

