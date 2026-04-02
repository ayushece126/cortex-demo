import { motion } from 'framer-motion'
import './ComparisonTable.css'

const features = [
  ['Smart dependency ordering', 'Partial', 'No', 'Partial', 'Yes ✓'],
  ['Cascade failure handling', 'No', 'No', 'No', 'Yes ✓'],
  ['Emergency stop', 'No', 'No', 'No', 'Yes ✓'],
  ['Health monitoring', 'Basic', 'No', 'Basic', '4 Types ✓'],
  ['Real-time UI dashboard', 'No', 'No', 'No', 'Yes ✓'],
  ['GPU validation', 'No', 'No', 'No', 'Yes ✓'],
  ['Mix Rust + Python + C++ + Docker', 'Docker only', 'ROS only', 'Any', 'Yes ✓'],
  ['Shell command safety', 'No', 'No', 'No', 'Yes ✓'],
  ['Built for robots', 'No', 'Partial', 'No', 'Yes ✓'],
]
const cellClass = v => v.startsWith('Yes') || v.startsWith('4 ') ? 'cell-yes' : v === 'No' || v.endsWith('only') ? 'cell-no' : 'cell-partial'

export default function ComparisonTable() {
  return (
    <section className="section table-section" id="compare">
      <div className="section-badge">07 — COMPARISON</div>
      <h2>Why Cortex Is Revolutionary</h2>
      <p className="section-sub">Compared to existing tools, Cortex was purpose-built for the unique challenges of robotics.</p>

      <motion.div className="table-wrap glass"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <table className="comp-table">
          <thead>
            <tr>
              <th className="feat-col">Feature</th>
              <th>Docker Compose</th>
              <th>ROS2 Launch</th>
              <th>systemd</th>
              <th className="cortex-col">Cortex 🧠</th>
            </tr>
          </thead>
          <tbody>
            {features.map((row, i) => (
              <motion.tr key={i}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <td className="feat-cell">{row[0]}</td>
                <td className={cellClass(row[1])}>{row[1]}</td>
                <td className={cellClass(row[2])}>{row[2]}</td>
                <td className={cellClass(row[3])}>{row[3]}</td>
                <td className="cell-yes cortex-cell">{row[4]}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  )
}
