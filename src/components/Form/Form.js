import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from './Form.module.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const programs = [
  'CAPP Youth Services',
  'Community Health Advocacy',
  'Healthy Families Putnam',
  'Insurance Navigation',
  'Lactation Services',
  'PICHC'
];

const Form = () => {
  const [existingForms, setExistingForms] = useState({});
  const [misnForm, setMisnForm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllForms = async () => {
      const misnDocRef = doc(db, 'FormsScreening', 'MISN_form');
      const misnDoc = await getDoc(misnDocRef);
      if (misnDoc.exists()) {
        console.log("MiSN form data fetched successfully:", misnDoc.data());
        setMisnForm({
          name: misnDoc.id,
          type: 'Screening',
          questions: misnDoc.data().form_screening_data || []
        });
      } else {
        console.error("MiSN form not found");
      }

      const fetchedForms = {};
      for (const program of programs) {
        const programDocRef = doc(db, 'ProgramForms', program);
        const programDoc = await getDoc(programDocRef);
        if (programDoc.exists()) {
          fetchedForms[program] = programDoc.data().forms;
        } else {
          fetchedForms[program] = [];
        }
      }
      setExistingForms(fetchedForms);
    };

    fetchAllForms();
  }, []);

  const handleDeleteForm = async (program, formIndex) => {
    try {
      const programDocRef = doc(db, 'ProgramForms', program);
      const updatedForms = existingForms[program].filter((_, index) => index !== formIndex);
      await updateDoc(programDocRef, { forms: updatedForms });
      setExistingForms(prevState => ({
        ...prevState,
        [program]: updatedForms
      }));
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handleCreateForm = (program) => {
    navigate(`/FormBuilding/${program}`);
  };

  const handleEditForm = (program, formIndex) => {
    navigate(`/FormBuilding/${program}/${formIndex}`);
  };

  return (
    <div className={styles.formPage}>
      <Sidebar className={styles.sidebar} />
      <div className={styles.formContainer}>
        <h1>Form Upload</h1>

        {/* MiSN Screening Form */}
        {misnForm && (
          <div className={styles.programCard}>
            <h2>MiSN Screening</h2>
            <div className={styles.formTypes}>
              <div className={styles.formType}>
                <div className={styles.formTypeHeader}>
                  <span>Name</span>
                  <span>Form Type</span>
                  <button type="button" className={styles.createFormButton} onClick={() => handleCreateForm('MISN_form')}>Create new form</button>
                </div>
                <div className={styles.formList}>
                  <div className={styles.formRow}>
                    <span>{misnForm.name}</span>
                    <span>{misnForm.type}</span>
                    <div>
                      <button type="button" className={styles.editButton} onClick={() => handleEditForm('MISN_form', 0)}>edit</button>
                      <button type="button" className={styles.deleteButton} onClick={() => handleDeleteForm('MISN_form', 0)}>delete</button>
                    </div>
                  </div>

                  {misnForm.questions.map((question, index) => (
                    <div key={index} className={styles.questionRow}>
                      {/* <span>{question.Question}</span>
                      <span>{question.Prompt}</span> */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {programs.map(program => (
          <div key={program} className={styles.programCard}>
            <h2>{program}</h2>
            <div className={styles.formTypes}>
              <div className={styles.formType}>
                <div className={styles.formTypeHeader}>
                  <span>Name</span>
                  <span>Form Type</span>
                  <button type="button" className={styles.createFormButton} onClick={() => handleCreateForm(program)}>Create new form</button>
                </div>
                <div className={styles.formList}>
                  {existingForms[program] && existingForms[program].map((form, formIndex) => (
                    <div key={formIndex} className={styles.formRow}>
                      <span>{form.name}</span>
                      <span>{form.type}</span>
                      <div>
                        <button type="button" className={styles.editButton} onClick={() => handleEditForm(program, formIndex)}>edit</button>
                        <button type="button" className={styles.deleteButton} onClick={() => handleDeleteForm(program, formIndex)}>delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Form;
