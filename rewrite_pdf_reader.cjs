const fs = require('fs');
let content = fs.readFileSync('src/pages/PdfReaderPage.tsx', 'utf8');

const splitPoint = `
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">`;

const parts = content.split(splitPoint);

if (parts.length !== 2) {
  console.log("Failed to split at return statement. Parts:", parts.length);
  process.exit(1);
}

let topPart = parts[0];

// We need to inject the new hooks before the end of the top part.
// The top part ends with `if (error || !note) { ... }`
// Let's find where to insert the new state variables.

const hookInjectionPoint = `const [isFullscreen, setIsFullscreen] = useState<boolean>(false);`;
const hookInjectionReplacement = `const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [showToolbar, setShowToolbar] = useState(true);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastScrollY = React.useRef(0);
  
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    // Use a small delay for initial render width capture
    setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [signedUrl]);

  const handleScroll = (e) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current + 15) {
      setShowToolbar(false);
    } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY < 20) {
      setShowToolbar(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const setPageRef = (index) => (el) => {
    if (!el) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNum = Number(entry.target.getAttribute('data-page-number'));
              if (pageNum) setVisiblePage(pageNum);
            }
          });
        },
        { threshold: 0.3 }
      );
    }
    observerRef.current.observe(el);
  };
`;

topPart = topPart.replace(hookInjectionPoint, hookInjectionReplacement);

// Also we need to modify toggleFullscreen to use document.documentElement
const fullscreenInjectionPoint = `const toggleFullscreen = () => {
    const viewerElement = document.getElementById('pdf-viewer-frame-container');`;

const fullscreenReplacement = `const toggleFullscreen = () => {
    const viewerElement = document.documentElement; // Make the whole page fullscreen`;

topPart = topPart.replace(fullscreenInjectionPoint, fullscreenReplacement);

// And we can remove unused nextPage and previousPage functions
topPart = topPart.replace(`const previousPage = () => changePage(-1);\n  const nextPage = () => changePage(1);`, ``);
topPart = topPart.replace(`const changePage = (offset: number) => {\n    setPageNumber(prevPageNumber => prevPageNumber + offset);\n  };`, ``);

// Construct new return statement
const newReturn = `
  // Calculate dynamic page width
  // On mobile, take full width minus small padding. On desktop, max out at 1000px.
  // Then apply user zoom multiplier.
  const padding = window.innerWidth < 640 ? 16 : 48;
  const baseWidth = Math.min(containerWidth - padding, 1000);
  const pageWidth = baseWidth > 0 ? baseWidth * (zoom / 100) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-[#e8eaed] flex flex-col font-sans">
      {/* Auto-hiding Toolbar */}
      <div 
        className={\`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-transform duration-300 \${showToolbar ? 'translate-y-0' : '-translate-y-full'}\`}
      >
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link 
            to="/notes"
            className="p-1.5 sm:p-2 -ml-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Notes"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div className="flex flex-col max-w-[150px] sm:max-w-md md:max-w-xl">
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate leading-tight">
              {note.title}
            </h1>
            <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate">
              {note.category?.name || 'Education Concept'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {numPages && (
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-slate-100/80 text-xs font-medium text-slate-600 border border-slate-200/50">
              Page {visiblePage} <span className="text-slate-400 mx-1">/</span> {numPages}
            </div>
          )}

          <div className="hidden md:flex items-center gap-0.5 bg-slate-100/80 rounded-full p-0.5 border border-slate-200/50">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1.5 rounded-full hover:bg-white hover:shadow-xs text-slate-600 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-medium text-xs text-slate-600 select-none">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(250, z + 15))}
              className="p-1.5 rounded-full hover:bg-white hover:shadow-xs text-slate-600 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-70"
          >
            {downloading ? <Loader2 className="w-4 h-4 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-4 h-4 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* PDF Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full pt-16 sm:pt-20 pb-12 sm:pb-24 px-2 sm:px-6 scroll-smooth"
      >
        <div className="flex flex-col items-center max-w-full mx-auto">
          {signedUrl ? (
            <Document
              file={signedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-slate-500">Loading document...</p>
                </div>
              }
              error={
                <div className="mt-20 text-center p-8 space-y-4 bg-white rounded-2xl border border-rose-100 max-w-md mx-auto shadow-sm">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-800">
                    Failed to load PDF viewer.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    Download PDF instead
                  </button>
                </div>
              }
            >
              {numPages && Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={\`page_\${index + 1}\`}
                  data-page-number={index + 1}
                  ref={setPageRef(index)}
                  className="mb-2 sm:mb-4 bg-white shadow-md transition-shadow hover:shadow-lg flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                >
                  <Page
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    width={pageWidth}
                    loading={
                      <div className="flex items-center justify-center bg-slate-50 w-full h-full text-slate-300">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    }
                  />
                </div>
              ))}
            </Document>
          ) : (
             <div className="mt-32 text-center p-8 space-y-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto shadow-sm">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm text-slate-600">
                Direct embedded rendering not supported or token expired.
              </p>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 w-full"
              >
                Download PDF to Read
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Page Indicator floating */}
      {numPages && (
        <div className={\`sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-medium shadow-lg transition-opacity duration-300 \${showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}>
          {visiblePage} / {numPages}
        </div>
      )}
    </div>
  );
};
`;

const finalContent = topPart + newReturn;
fs.writeFileSync('src/pages/PdfReaderPage.tsx', finalContent);
console.log("Success!");
