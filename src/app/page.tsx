import FormSheet from "./components/FormSheet";
import Navbar from "./components/Navbar";
export default function Home() {
  return (
    <>
      <Navbar/>
      {/* <FormSheet/> */}
      <main className="p-6 bg-blue-300">
        <FormSheet/>
        </main>
    </>
  );
}
